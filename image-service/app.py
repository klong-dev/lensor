import os
import rawpy
import imageio
from PIL import Image
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import logging
from dotenv import load_dotenv
from functools import wraps
import jwt

# Load environment variables
load_dotenv()

app = Flask(__name__)
app.config['UPLOAD_FOLDER'] = os.getenv('UPLOAD_FOLDER', './uploads')
app.config['THUMBNAIL_HEIGHT'] = int(os.getenv('THUMBNAIL_HEIGHT', 320))
app.config['MAX_FILE_SIZE'] = int(os.getenv('MAX_FILE_SIZE', 104857600))  # 100MB
app.config['JWT_SECRET'] = os.getenv('JWT_SECRET')

# Create upload directories
os.makedirs(app.config['UPLOAD_FOLDER'], exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'originals'), exist_ok=True)
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'thumbnails'), exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Allowed extensions
RAW_EXTENSIONS = set(os.getenv('ALLOWED_RAW_EXTENSIONS', 'cr2,cr3,arw,nef,raf,dng,rw2').split(','))
IMAGE_EXTENSIONS = set(os.getenv('ALLOWED_IMAGE_EXTENSIONS', 'jpg,jpeg,png,webp').split(','))

def allowed_file(filename, allowed_extensions):
    return '.' in filename and filename.rsplit('.', 1)[1].lower() in allowed_extensions

def convert_raw_to_jpg(raw_path, output_path):
    """Convert RAW image to JPG"""
    try:
        with rawpy.imread(raw_path) as raw:
            rgb = raw.postprocess(
                use_camera_wb=True,
                half_size=False,
                no_auto_bright=False,
                output_bps=8
            )
        imageio.imsave(output_path, rgb)
        logger.info(f'Converted RAW to JPG: {output_path}')
        return True
    except Exception as e:
        logger.error(f'Error converting RAW to JPG: {str(e)}')
        raise

def create_thumbnail(image_path, thumbnail_path, height=320):
    """Create thumbnail with specified height, auto width"""
    try:
        with Image.open(image_path) as img:
            # Convert RGBA to RGB if needed
            if img.mode in ('RGBA', 'LA', 'P'):
                background = Image.new('RGB', img.size, (255, 255, 255))
                if img.mode == 'P':
                    img = img.convert('RGBA')
                background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                img = background
            
            # Calculate new width maintaining aspect ratio
            aspect_ratio = img.width / img.height
            new_width = int(height * aspect_ratio)
            
            # Resize image
            img.thumbnail((new_width, height), Image.Resampling.LANCZOS)
            
            # Save thumbnail
            img.save(thumbnail_path, 'JPEG', quality=85, optimize=True)
            logger.info(f'Created thumbnail: {thumbnail_path}')
            return True
    except Exception as e:
        logger.error(f'Error creating thumbnail: {str(e)}')
        raise

def process_image(file, filename):
    """Process uploaded image file"""
    file_ext = filename.rsplit('.', 1)[1].lower()
    unique_filename = f"{uuid.uuid4().hex}_{int(datetime.now().timestamp())}"
    
    # Paths
    original_filename = f"{unique_filename}.jpg"
    thumbnail_filename = f"{unique_filename}_thumb.jpg"
    
    original_path = os.path.join(app.config['UPLOAD_FOLDER'], 'originals', original_filename)
    thumbnail_path = os.path.join(app.config['UPLOAD_FOLDER'], 'thumbnails', thumbnail_filename)
    
    # Check if file is RAW
    is_raw = file_ext in RAW_EXTENSIONS
    
    if is_raw:
        # Save RAW file temporarily
        temp_path = os.path.join(app.config['UPLOAD_FOLDER'], f'temp_{unique_filename}.{file_ext}')
        file.save(temp_path)
        
        try:
            # Convert RAW to JPG
            convert_raw_to_jpg(temp_path, original_path)
            
            # Remove temp RAW file
            os.remove(temp_path)
        except Exception as e:
            # Clean up on error
            if os.path.exists(temp_path):
                os.remove(temp_path)
            raise e
    else:
        # Save regular image directly
        file.save(original_path)
        
        # Convert to JPG if needed
        if file_ext not in ['jpg', 'jpeg']:
            with Image.open(original_path) as img:
                if img.mode in ('RGBA', 'LA', 'P'):
                    background = Image.new('RGB', img.size, (255, 255, 255))
                    if img.mode == 'P':
                        img = img.convert('RGBA')
                    background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
                    img = background
                img.save(original_path, 'JPEG', quality=95)
    
    # Create thumbnail
    create_thumbnail(original_path, thumbnail_path, app.config['THUMBNAIL_HEIGHT'])
    
    return {
        'original': f'/uploads/originals/{original_filename}',
        'thumbnail': f'/uploads/thumbnails/{thumbnail_filename}',
        'filename': original_filename
    }

@app.route('/health', methods=['GET'])
def health_check():
    """Health check endpoint"""
    return jsonify({
        'status': 'healthy',
        'service': 'image-processing',
        'timestamp': datetime.now().isoformat()
    }), 200

@app.route('/upload/single', methods=['POST'])
def upload_single():
    """Upload and process single image"""
    try:
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Validate file extension
        all_extensions = RAW_EXTENSIONS | IMAGE_EXTENSIONS
        if not allowed_file(file.filename, all_extensions):
            return jsonify({
                'error': f'File type not allowed. Supported: {", ".join(all_extensions)}'
            }), 400
        
        # Process image
        result = process_image(file, file.filename)
        
        return jsonify({
            'success': True,
            'data': result
        }), 200
        
    except Exception as e:
        logger.error(f'Error uploading single file: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/upload/multiple', methods=['POST'])
def upload_multiple():
    """Upload and process multiple images"""
    try:
        if 'files' not in request.files:
            return jsonify({'error': 'No files provided'}), 400
        
        files = request.files.getlist('files')
        
        if not files or len(files) == 0:
            return jsonify({'error': 'No files selected'}), 400
        
        results = []
        errors = []
        
        for file in files:
            try:
                if file.filename == '':
                    continue
                
                # Validate file extension
                all_extensions = RAW_EXTENSIONS | IMAGE_EXTENSIONS
                if not allowed_file(file.filename, all_extensions):
                    errors.append({
                        'filename': file.filename,
                        'error': 'File type not allowed'
                    })
                    continue
                
                # Process image
                result = process_image(file, file.filename)
                results.append(result)
                
            except Exception as e:
                logger.error(f'Error processing file {file.filename}: {str(e)}')
                errors.append({
                    'filename': file.filename,
                    'error': str(e)
                })
        
        return jsonify({
            'success': True,
            'data': {
                'uploaded': results,
                'failed': errors,
                'total': len(files),
                'successful': len(results),
                'failed_count': len(errors)
            }
        }), 200
        
    except Exception as e:
        logger.error(f'Error uploading multiple files: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.route('/uploads/<path:filepath>', methods=['GET'])
def serve_file(filepath):
    """Serve uploaded files"""
    try:
        file_path = os.path.join(app.config['UPLOAD_FOLDER'], filepath)
        if os.path.exists(file_path):
            return send_file(file_path)
        return jsonify({'error': 'File not found'}), 404
    except Exception as e:
        logger.error(f'Error serving file: {str(e)}')
        return jsonify({'error': str(e)}), 500

@app.errorhandler(413)
def request_entity_too_large(error):
    return jsonify({'error': 'File too large'}), 413

@app.errorhandler(404)
def not_found(error):
    return jsonify({'error': 'Endpoint not found'}), 404

@app.errorhandler(500)
def internal_error(error):
    return jsonify({'error': 'Internal server error'}), 500

if __name__ == '__main__':
    app.run(
        host='0.0.0.0',
        port=int(os.getenv('FLASK_PORT', 5000)),
        debug=os.getenv('FLASK_ENV') == 'development'
    )
