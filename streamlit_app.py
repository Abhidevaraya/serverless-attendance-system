import base64
import json
import requests
import streamlit as st
from urllib.parse import urlencode

st.set_page_config(page_title='Attendance Dashboard', layout='wide')

if 'api_base_url' not in st.session_state:
    st.session_state.api_base_url = ''

def validate_api_url(url: str) -> str:
    if not url:
        raise ValueError('API Base URL is required.')
    cleaned = url.strip()
    if not cleaned.startswith(('http://', 'https://')):
        raise ValueError('API Base URL must start with http:// or https://')
    if '<' in cleaned or '>' in cleaned or 'your-api-id' in cleaned.lower() or 'your-api' in cleaned.lower():
        raise ValueError('Replace the placeholder URL with your actual deployed API Gateway endpoint.')
    return cleaned.rstrip('/')


def build_anurag_email(roll_number: str) -> str:
    if not roll_number:
        raise ValueError('Roll number is required.')
    cleaned = roll_number.strip().lower()
    if '@' in cleaned:
        if not cleaned.endswith('@anurag.edu.in'):
            raise ValueError('Email must end with @anurag.edu.in')
        return cleaned
    return f"{cleaned}@anurag.edu.in"


def set_api_url(url: str):
    st.session_state.api_base_url = validate_api_url(url)

@st.cache_data
def api_get(path: str):
    if not st.session_state.api_base_url:
        raise ValueError('API base URL is not configured')
    url = f"{st.session_state.api_base_url}{path}"
    resp = requests.get(url)
    data = resp.json()
    if not resp.ok:
        raise requests.HTTPError(json.dumps(data))
    return data

@st.cache_data
def api_post(path: str, payload: dict):
    if not st.session_state.api_base_url:
        raise ValueError('API base URL is not configured')
    url = f"{st.session_state.api_base_url}{path}"
    headers = {'Content-Type': 'application/json'}
    resp = requests.post(url, headers=headers, json=payload)
    data = resp.json()
    if not resp.ok:
        raise requests.HTTPError(json.dumps(data))
    return data

st.title('Serverless Attendance System')
st.write('Use this dashboard to signup, login, mark attendance, upload photos, and generate reports.')

with st.sidebar:
    st.header('Configuration')
    api_url = st.text_input('API Base URL', value=st.session_state.api_base_url or 'http://127.0.0.1:3000', placeholder='http://127.0.0.1:3000')
    if st.button('Save API URL'):
        set_api_url(api_url)
        st.success('API URL saved')
    if st.session_state.api_base_url:
        st.write('Current API URL:')
        st.write(st.session_state.api_base_url)

if not st.session_state.api_base_url:
    st.warning('Enter your deployed API Gateway endpoint in the sidebar before using the dashboard.')

col1, col2 = st.columns(2)

with col1:
    st.header('Signup')
    with st.form('signup_form'):
        signup_roll = st.text_input('Roll number (no domain)', key='signup_roll')
        st.caption('You will sign up with rollno@anurag.edu.in')
        signup_name = st.text_input('Name', key='signup_name')
        signup_password = st.text_input('Password', type='password', key='signup_password')
        signup_submit = st.form_submit_button('Signup')
    if signup_submit:
        try:
            signup_email = build_anurag_email(signup_roll)
            result = api_post('/signup', {
                'email': signup_email,
                'name': signup_name,
                'password': signup_password,
            })
            st.success('Signup successful')
            st.json(result)
        except Exception as e:
            st.error(str(e))

    st.header('Login')
    with st.form('login_form'):
        login_roll = st.text_input('Roll number (no domain)', key='login_roll')
        st.caption('You will login with rollno@anurag.edu.in')
        login_password = st.text_input('Password', type='password', key='login_password')
        login_submit = st.form_submit_button('Login')
    if login_submit:
        try:
            login_email = build_anurag_email(login_roll)
            result = api_post('/login', {
                'email': login_email,
                'password': login_password,
            })
            st.success('Login successful')
            st.json(result)
        except Exception as e:
            st.error(str(e))

with col2:
    st.header('Mark Attendance')
    with st.form('attendance_form'):
        attendance_email = st.text_input('Email', key='attendance_email')
        attendance_status = st.selectbox('Status', ['', 'present', 'absent', 'late'], key='attendance_status')
        attendance_timestamp = st.datetime_input('Timestamp', key='attendance_timestamp')
        attendance_location = st.text_input('Location (optional)', key='attendance_location')
        attendance_notes = st.text_area('Notes (optional)', key='attendance_notes')
        attendance_submit = st.form_submit_button('Submit Attendance')
    if attendance_submit:
        try:
            payload = {
                'email': attendance_email,
                'status': attendance_status,
                'timestamp': attendance_timestamp.isoformat() if attendance_timestamp else None,
                'location': attendance_location or None,
                'notes': attendance_notes or None,
            }
            result = api_post('/attendance', payload)
            st.success('Attendance recorded')
            st.json(result)
        except Exception as e:
            st.error(str(e))

    st.header('Upload Photo')
    with st.form('photo_form'):
        photo_email = st.text_input('Email', key='photo_email')
        photo_file_name = st.text_input('File name', key='photo_file_name')
        photo_file = st.file_uploader('Photo file', type=['png', 'jpg', 'jpeg'], key='photo_file')
        photo_submit = st.form_submit_button('Upload Photo')
    if photo_submit:
        if not photo_file:
            st.error('Please select a photo file to upload.')
        else:
            try:
                blob = photo_file.read()
                base64_data = base64.b64encode(blob).decode('utf-8')
                result = api_post('/photos', {
                    'email': photo_email,
                    'fileName': photo_file_name or photo_file.name,
                    'imageBase64': base64_data,
                })
                st.success('Photo uploaded')
                st.json(result)
            except Exception as e:
                st.error(str(e))

st.header('Attendance Reports')
with st.form('reports_form'):
    report_email = st.text_input('Email', key='report_email')
    report_start = st.date_input('Start date', key='report_start')
    report_end = st.date_input('End date', key='report_end')
    report_submit = st.form_submit_button('Generate Report')
if report_submit:
    try:
        query = {
            'email': report_email,
            'startDate': report_start.isoformat(),
            'endDate': report_end.isoformat(),
        }
        query_string = urlencode(query)
        result = api_get(f"/reports?{query_string}")
        st.success('Report generated')
        st.json(result)
    except Exception as e:
        st.error(str(e))
