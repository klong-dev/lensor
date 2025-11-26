import os
import rawpy
import imageio
from PIL import Image, ExifTags
from flask import Flask, request, jsonify, send_file
from werkzeug.utils import secure_filename
import uuid
from datetime import datetime
import logging
from dotenv import load_dotenv
from functools import wraps
import jwt
import xml.etree.ElementTree as ET
import hashlib

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
os.makedirs(os.path.join(app.config['UPLOAD_FOLDER'], 'presets'), exist_ok=True)

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

# Allowed extensions
RAW_EXTENSIONS = set(os.getenv('ALLOWED_RAW_EXTENSIONS', 'cr2,cr3,arw,nef,raf,dng,rw2').split(','))
IMAGE_EXTENSIONS = set(os.getenv('ALLOWED_IMAGE_EXTENSIONS', 'jpg,jpeg,png,webp').split(','))
PRESET_EXTENSIONS = set(['xmp', 'lrtemplate', 'dcp', 'dng'])  # Preset file extensions

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

def extract_exif_data(image_path):
    """Extract comprehensive EXIF metadata from image"""
    try:
        with Image.open(image_path) as img:
            metadata = {}
            
            # Get basic image info
            metadata['width'] = img.width
            metadata['height'] = img.height
            metadata['dimensions'] = f"{img.width}x{img.height}"
            metadata['format'] = img.format
            metadata['colorSpace'] = img.mode
            
            # Get file size
            if os.path.exists(image_path):
                metadata['fileSize'] = os.path.getsize(image_path)
            
            # Get EXIF data
            exif = img._getexif()
            if exif is None:
                return metadata
            
            # Create reverse lookup for EXIF tags
            exif_tags = {v: k for k, v in ExifTags.TAGS.items()}
            
            # Helper function to get EXIF value
            def get_exif_value(tag_name):
                tag_id = exif_tags.get(tag_name)
                if tag_id and tag_id in exif:
                    return exif[tag_id]
                return None
            
            # Helper function to format rational number
            def format_rational(value):
                if hasattr(value, 'numerator') and hasattr(value, 'denominator'):
                    if value.denominator == 0:
                        return None
                    return value.numerator / value.denominator
                return value
            
            # Basic Image Info
            orientation = get_exif_value('Orientation')
            if orientation:
                metadata['orientation'] = int(orientation)
            
            resolution_unit = get_exif_value('ResolutionUnit')
            x_resolution = get_exif_value('XResolution')
            if x_resolution:
                dpi = format_rational(x_resolution)
                if dpi:
                    metadata['dpi'] = int(dpi)
            
            bits_per_sample = get_exif_value('BitsPerSample')
            if bits_per_sample:
                if isinstance(bits_per_sample, tuple):
                    metadata['bitDepth'] = sum(bits_per_sample)
                else:
                    metadata['bitDepth'] = int(bits_per_sample)
            
            # Camera Information
            camera_make = get_exif_value('Make')
            if camera_make:
                metadata['cameraMake'] = str(camera_make).strip()
            
            camera_model = get_exif_value('Model')
            if camera_model:
                metadata['cameraModel'] = str(camera_model).strip()
            
            camera_serial = get_exif_value('BodySerialNumber')
            if camera_serial:
                metadata['cameraSerialNumber'] = str(camera_serial).strip()
            
            # Lens Information
            lens_make = get_exif_value('LensMake')
            if lens_make:
                metadata['lensMake'] = str(lens_make).strip()
            
            lens_model = get_exif_value('LensModel')
            if lens_model:
                metadata['lensModel'] = str(lens_model).strip()
            
            lens_serial = get_exif_value('LensSerialNumber')
            if lens_serial:
                metadata['lensSerialNumber'] = str(lens_serial).strip()
            
            focal_length = get_exif_value('FocalLength')
            if focal_length:
                fl = format_rational(focal_length)
                if fl:
                    metadata['focalLength'] = f"{fl:.0f}mm"
            
            focal_length_35mm = get_exif_value('FocalLengthIn35mmFilm')
            if focal_length_35mm:
                metadata['focalLengthIn35mm'] = f"{int(focal_length_35mm)}mm"
            
            # Exposure Settings
            iso = get_exif_value('ISOSpeedRatings')
            if iso:
                metadata['iso'] = int(iso) if isinstance(iso, int) else iso
            
            f_number = get_exif_value('FNumber')
            if f_number:
                f_val = format_rational(f_number)
                if f_val:
                    metadata['fStop'] = f"f/{f_val:.1f}"
                    metadata['aperture'] = f"f/{f_val:.1f}"
            
            exposure_time = get_exif_value('ExposureTime')
            if exposure_time:
                exp = format_rational(exposure_time)
                if exp:
                    if exp < 1:
                        metadata['shutterSpeed'] = f"1/{int(1/exp)}s"
                        metadata['exposureTime'] = f"1/{int(1/exp)}s"
                    else:
                        metadata['shutterSpeed'] = f"{exp:.2f}s"
                        metadata['exposureTime'] = f"{exp:.2f}s"
            
            exposure_mode = get_exif_value('ExposureMode')
            if exposure_mode is not None:
                modes = {0: 'Auto', 1: 'Manual', 2: 'Auto bracket'}
                metadata['exposureMode'] = modes.get(exposure_mode, f'Unknown ({exposure_mode})')
            
            exposure_program = get_exif_value('ExposureProgram')
            if exposure_program is not None:
                programs = {
                    0: 'Not defined', 1: 'Manual', 2: 'Program AE',
                    3: 'Aperture-priority AE', 4: 'Shutter speed priority AE',
                    5: 'Creative (Slow speed)', 6: 'Action (High speed)',
                    7: 'Portrait', 8: 'Landscape'
                }
                metadata['exposureProgram'] = programs.get(exposure_program, f'Unknown ({exposure_program})')
            
            exposure_bias = get_exif_value('ExposureBiasValue')
            if exposure_bias:
                bias = format_rational(exposure_bias)
                if bias is not None:
                    metadata['exposureBias'] = f"{bias:+.1f} EV"
            
            metering_mode = get_exif_value('MeteringMode')
            if metering_mode is not None:
                modes = {
                    0: 'Unknown', 1: 'Average', 2: 'Center-weighted average',
                    3: 'Spot', 4: 'Multi-spot', 5: 'Multi-segment', 6: 'Partial'
                }
                metadata['meteringMode'] = modes.get(metering_mode, f'Unknown ({metering_mode})')
            
            # Flash & Lighting
            flash = get_exif_value('Flash')
            if flash is not None:
                flash_fired = flash & 0x01
                flash_modes = {
                    0x00: 'No flash', 0x01: 'Fired',
                    0x05: 'Fired, Return not detected',
                    0x07: 'Fired, Return detected',
                    0x09: 'Yes, compulsory', 0x0D: 'Yes, compulsory, return not detected',
                    0x0F: 'Yes, compulsory, return detected',
                    0x10: 'No, compulsory', 0x18: 'No, auto',
                    0x19: 'Yes, auto', 0x1D: 'Yes, auto, return not detected',
                    0x1F: 'Yes, auto, return detected'
                }
                metadata['flash'] = flash_modes.get(flash, f'Flash ({flash})')
            
            white_balance = get_exif_value('WhiteBalance')
            if white_balance is not None:
                wb_modes = {0: 'Auto', 1: 'Manual'}
                metadata['whiteBalance'] = wb_modes.get(white_balance, f'Unknown ({white_balance})')
            
            light_source = get_exif_value('LightSource')
            if light_source is not None:
                sources = {
                    0: 'Unknown', 1: 'Daylight', 2: 'Fluorescent',
                    3: 'Tungsten', 4: 'Flash', 9: 'Fine weather',
                    10: 'Cloudy', 11: 'Shade', 12: 'Daylight fluorescent',
                    13: 'Day white fluorescent', 14: 'Cool white fluorescent',
                    15: 'White fluorescent', 17: 'Standard light A',
                    18: 'Standard light B', 19: 'Standard light C',
                    20: 'D55', 21: 'D65', 22: 'D75', 23: 'D50',
                    24: 'ISO studio tungsten', 255: 'Other'
                }
                metadata['lightSource'] = sources.get(light_source, f'Unknown ({light_source})')
            
            # Focus Settings
            focus_mode = get_exif_value('FocusMode')
            if focus_mode:
                metadata['focusMode'] = str(focus_mode)
            
            subject_distance = get_exif_value('SubjectDistance')
            if subject_distance:
                dist = format_rational(subject_distance)
                if dist:
                    metadata['subjectDistance'] = f"{dist:.2f}m"
            
            subject_distance_range = get_exif_value('SubjectDistanceRange')
            if subject_distance_range is not None:
                ranges = {0: 'Unknown', 1: 'Macro', 2: 'Close', 3: 'Distant'}
                metadata['subjectDistanceRange'] = ranges.get(subject_distance_range, f'Unknown ({subject_distance_range})')
            
            # Date & Time
            date_time_original = get_exif_value('DateTimeOriginal')
            if date_time_original:
                metadata['dateTimeOriginal'] = str(date_time_original)
            
            date_time_digitized = get_exif_value('DateTimeDigitized')
            if date_time_digitized:
                metadata['dateTimeDigitized'] = str(date_time_digitized)
            
            date_time = get_exif_value('DateTime')
            if date_time:
                metadata['dateTime'] = str(date_time)
            
            # Author & Copyright
            artist = get_exif_value('Artist')
            if artist:
                metadata['artist'] = str(artist).strip()
                metadata['author'] = str(artist).strip()
            
            copyright_info = get_exif_value('Copyright')
            if copyright_info:
                metadata['copyright'] = str(copyright_info).strip()
            
            # Software
            software = get_exif_value('Software')
            if software:
                metadata['software'] = str(software).strip()
            
            # Image Quality Settings
            contrast = get_exif_value('Contrast')
            if contrast is not None:
                contrasts = {0: 'Normal', 1: 'Low', 2: 'High'}
                metadata['contrast'] = contrasts.get(contrast, f'Unknown ({contrast})')
            
            saturation = get_exif_value('Saturation')
            if saturation is not None:
                saturations = {0: 'Normal', 1: 'Low', 2: 'High'}
                metadata['saturation'] = saturations.get(saturation, f'Unknown ({saturation})')
            
            sharpness = get_exif_value('Sharpness')
            if sharpness is not None:
                sharpnesses = {0: 'Normal', 1: 'Soft', 2: 'Hard'}
                metadata['sharpness'] = sharpnesses.get(sharpness, f'Unknown ({sharpness})')
            
            brightness = get_exif_value('BrightnessValue')
            if brightness:
                bright = format_rational(brightness)
                if bright is not None:
                    metadata['brightness'] = f"{bright:.2f}"
            
            gain_control = get_exif_value('GainControl')
            if gain_control is not None:
                gains = {0: 'None', 1: 'Low gain up', 2: 'High gain up', 3: 'Low gain down', 4: 'High gain down'}
                metadata['gainControl'] = gains.get(gain_control, f'Unknown ({gain_control})')
            
            digital_zoom = get_exif_value('DigitalZoomRatio')
            if digital_zoom:
                zoom = format_rational(digital_zoom)
                if zoom:
                    metadata['digitalZoomRatio'] = f"{zoom:.2f}x"
            
            # Scene Information
            scene_type = get_exif_value('SceneType')
            if scene_type:
                metadata['sceneType'] = str(scene_type)
            
            scene_capture_type = get_exif_value('SceneCaptureType')
            if scene_capture_type is not None:
                scenes = {0: 'Standard', 1: 'Landscape', 2: 'Portrait', 3: 'Night'}
                metadata['sceneCaptureType'] = scenes.get(scene_capture_type, f'Unknown ({scene_capture_type})')
            
            # GPS Information
            gps_info = get_exif_value('GPSInfo')
            if gps_info:
                try:
                    # Extract GPS coordinates
                    def convert_to_degrees(value):
                        d = float(value[0])
                        m = float(value[1])
                        s = float(value[2])
                        return d + (m / 60.0) + (s / 3600.0)
                    
                    if 2 in gps_info and 4 in gps_info:  # Latitude and Longitude
                        lat = convert_to_degrees(gps_info[2])
                        if gps_info[1] == 'S':
                            lat = -lat
                        
                        lon = convert_to_degrees(gps_info[4])
                        if gps_info[3] == 'W':
                            lon = -lon
                        
                        metadata['gpsLatitude'] = lat
                        metadata['gpsLongitude'] = lon
                        metadata['gpsLocation'] = f"{lat:.6f}, {lon:.6f}"
                    
                    if 6 in gps_info:  # Altitude
                        alt = format_rational(gps_info[6])
                        if alt:
                            metadata['gpsAltitude'] = alt
                except Exception as e:
                    logger.warning(f'Error extracting GPS data: {str(e)}')
            
            logger.info(f'Extracted comprehensive EXIF data with {len(metadata)} fields')
            return metadata
            
    except Exception as e:
        logger.warning(f'Could not extract EXIF data: {str(e)}')
        return {}

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
    
    # Extract EXIF metadata
    exif_data = extract_exif_data(original_path)
    
    return {
        'original': f'/uploads/originals/{original_filename}',
        'thumbnail': f'/uploads/thumbnails/{thumbnail_filename}',
        'filename': original_filename,
        'metadata': exif_data
    }

def read_signature_from_xmp(xmp_path):
    """Read existing signature from XMP file if exists"""
    try:
        tree = ET.parse(xmp_path)
        root = tree.getroot()
        ns = {
            "rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#",
            "lensor": "https://lensor.io/xmp/"
        }
        
        # Find signature node
        sig_node = root.find(".//lensor:Signature", ns)
        if sig_node is not None and sig_node.text:
            # Parse signature: "UID=xxx;SIGN=yyy"
            parts = sig_node.text.split(';')
            data = {}
            for part in parts:
                if '=' in part:
                    key, value = part.split('=', 1)
                    data[key] = value
            return data.get('UID'), data.get('SIGN')
        return None, None
    except Exception as e:
        logger.warning(f'Failed to read signature from XMP: {str(e)}')
        return None, None

def append_signature_to_xmp(xmp_path, user_id, signature):
    """Append signature to XMP file"""
    try:
        tree = ET.parse(xmp_path)
        root = tree.getroot()
        ns = {"rdf": "http://www.w3.org/1999/02/22-rdf-syntax-ns#"}
        rdf = root.find(".//rdf:RDF", ns)
        
        if rdf is None:
            raise ValueError("Invalid XMP file: missing rdf:RDF element")
        
        # Register custom namespace
        ET.register_namespace("lensor", "https://lensor.io/xmp/")
        ET.register_namespace("rdf", "http://www.w3.org/1999/02/22-rdf-syntax-ns#")
        
        # Create Description and Signature nodes
        desc = ET.SubElement(rdf, "{https://lensor.io/xmp/}Description")
        sig_node = ET.SubElement(desc, "{https://lensor.io/xmp/}Signature")
        sig_node.text = f"UID={user_id};SIGN={signature}"
        
        tree.write(xmp_path, xml_declaration=True, encoding="utf-8")
        return True
    except Exception as e:
        logger.error(f'Failed to append signature to XMP: {str(e)}')
        raise

def generate_signature(user_id, file_path, secret_key=None):
    """Generate signature based on user_id and file content"""
    if secret_key is None:
        secret_key = app.config.get('SECRET_KEY', 'default-secret-key')
    
    # ✅ Hash dựa trên nội dung file, không phụ thuộc filename
    file_hash = generate_file_hash(file_path)
    data = f"{user_id}:{file_hash}:{secret_key}"
    return hashlib.sha256(data.encode()).hexdigest()[:32]

def generate_file_hash(file_path):
    """Generate hash of file content"""
    hasher = hashlib.sha256()
    with open(file_path, 'rb') as f:
        for chunk in iter(lambda: f.read(4096), b""):
            hasher.update(chunk)
    return hasher.hexdigest()[:32]

def verify_signature(user_id, file_path, signature, secret_key=None):
    """Verify signature matches"""
    expected_signature = generate_signature(user_id, file_path, secret_key)
    return signature == expected_signature

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

@app.route('/upload/preset', methods=['POST'])
def upload_preset():
    """Upload preset file with signature validation and ownership check"""
    temp_file_path = None
    
    try:
        # Validate file exists
        if 'file' not in request.files:
            return jsonify({'error': 'No file provided'}), 400
        
        file = request.files['file']
        
        if file.filename == '':
            return jsonify({'error': 'No file selected'}), 400
        
        # Get user_id from form data (sent by NestJS)
        user_id = request.form.get('userId') or request.form.get('user_id')
        
        if not user_id:
            logger.error('Missing user_id in request')
            return jsonify({
                'error': 'User ID is required',
                'code': 'MISSING_USER_ID'
            }), 400
        
        # Validate file extension
        file_ext = file.filename.rsplit('.', 1)[1].lower() if '.' in file.filename else ''
        
        if not file_ext or file_ext not in PRESET_EXTENSIONS:
            return jsonify({
                'error': f'File type not allowed. Supported formats: {", ".join(PRESET_EXTENSIONS)}',
                'code': 'INVALID_FILE_TYPE'
            }), 400
        
        # Generate unique filename
        timestamp = int(datetime.now().timestamp())
        unique_filename = f"{uuid.uuid4().hex}_{timestamp}.{file_ext}"
        
        # Create presets directory if not exists
        presets_dir = os.path.join(app.config['UPLOAD_FOLDER'], 'presets')
        os.makedirs(presets_dir, exist_ok=True)
        
        # Save file temporarily
        preset_path = os.path.join(presets_dir, unique_filename)
        temp_file_path = preset_path  # Track for cleanup
        file.save(preset_path)
        
        logger.info(f'Saved preset file temporarily: {unique_filename}')
        
        # Process XMP files - Add signature and validate ownership
        if file_ext == 'xmp':
            try:
                # Check for existing signature (anti-piracy)
                existing_user_id, existing_signature = read_signature_from_xmp(preset_path)
                
                if existing_user_id and existing_signature:
                    # File already has a signature - someone is re-uploading
                    logger.warning(
                        f'Preset already has signature: owner={existing_user_id}, uploader={user_id}'
                    )
                    
                    if existing_user_id != user_id:
                        # CRITICAL: Different user trying to re-upload someone else's preset
                        os.remove(preset_path)
                        logger.error(
                            f'🚨 SECURITY: User {user_id} attempted to upload preset owned by {existing_user_id}'
                        )
                        return jsonify({
                            'error': 'This preset belongs to another user. Unauthorized upload detected.',
                            'code': 'PRESET_OWNERSHIP_VIOLATION'
                        }), 403
                    else:
                        # Same user re-uploading their own preset - allowed
                        logger.info(f'User {user_id} is re-uploading their own preset')
                        # Continue to add new signature
                
                # Generate and append signature
                signature = generate_signature(user_id, preset_path)
                append_signature_to_xmp(preset_path, user_id, signature)
                
                logger.info(
                    f'✅ Added signature to XMP: {unique_filename} | User: {user_id} | Sign: {signature[:8]}...'
                )
                
            except ET.ParseError as parse_error:
                # Invalid XML structure
                if os.path.exists(preset_path):
                    os.remove(preset_path)
                logger.error(f'Invalid XMP XML structure: {str(parse_error)}')
                return jsonify({
                    'error': 'Invalid XMP file format. File may be corrupted.',
                    'code': 'INVALID_XMP_FORMAT'
                }), 400
                
            except ValueError as val_error:
                # Missing required XMP elements
                if os.path.exists(preset_path):
                    os.remove(preset_path)
                logger.error(f'Invalid XMP structure: {str(val_error)}')
                return jsonify({
                    'error': str(val_error),
                    'code': 'INVALID_XMP_STRUCTURE'
                }), 400
                
            except Exception as sig_error:
                # Signature processing failed
                if os.path.exists(preset_path):
                    os.remove(preset_path)
                logger.error(f'Signature processing error: {str(sig_error)}')
                return jsonify({
                    'error': 'Failed to process preset signature',
                    'code': 'SIGNATURE_PROCESSING_ERROR',
                    'details': str(sig_error)
                }), 500
        
        # Success - file uploaded and signed
        logger.info(f'✅ Preset upload successful: {unique_filename} for user {user_id}')
        
        return jsonify({
            'success': True,
            'data': {
                'url': f'/uploads/presets/{unique_filename}',
                'filename': unique_filename,
                'userId': user_id,
                'fileType': file_ext
            }
        }), 200
        
    except Exception as e:
        # Cleanup on error
        if temp_file_path and os.path.exists(temp_file_path):
            try:
                os.remove(temp_file_path)
                logger.info(f'Cleaned up temporary file: {temp_file_path}')
            except Exception as cleanup_error:
                logger.error(f'Failed to cleanup file: {str(cleanup_error)}')
        
        logger.error(f'❌ Preset upload error: {str(e)}', exc_info=True)
        return jsonify({
            'error': 'Internal server error during preset upload',
            'code': 'UPLOAD_ERROR'
        }), 500

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
