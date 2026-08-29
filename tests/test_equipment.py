import pytest
from models import db, Equipment

def test_add_equipment(client, qa_token):
    response = client.post('/equipment', 
        headers={'Authorization': f'Bearer {qa_token}'},
        json={
            'name': 'Centrifuge #3',
            'serial_number': 'SN-12345',
            'location': 'Cleanroom A',
            'last_calibration_date': '2026-08-01',
            'next_calibration_date': '2027-08-01'
        }
    )
    assert response.status_code == 201
    assert response.get_json()['message'] == "Equipment added successfully!"

def test_add_equipment_missing_fields(client, qa_token):
    response = client.post('/equipment', 
        headers={'Authorization': f'Bearer {qa_token}'},
        json={'name': 'Scale'} # Missing serial and dates
    )
    assert response.status_code == 400

def test_get_equipment(client, qa_token, app):
    # Ensure there is data to fetch by running the add test logic first manually in DB
    with app.app_context():
        # Clean state for reliable testing
        Equipment.query.delete()
        db.session.commit()
        
    client.post('/equipment', headers={'Authorization': f'Bearer {qa_token}'}, json={
        'name': 'Incubator', 'serial_number': 'INC-01', 
        'last_calibration_date': '2026-01-01', 'next_calibration_date': '2027-01-01'
    })

    response = client.get('/equipment', headers={'Authorization': f'Bearer {qa_token}'})
    assert response.status_code == 200
    assert len(response.get_json()) >= 1
    assert response.get_json()[0]['name'] == 'Incubator'