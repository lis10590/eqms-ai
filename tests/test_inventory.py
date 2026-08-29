import pytest
from models import db, InventoryItem

def test_add_inventory(client, qa_token):
    response = client.post('/inventory', 
        headers={'Authorization': f'Bearer {qa_token}'},
        json={
            'name': 'Sterile IPA 70%',
            'category': 'Consumables',
            'lot_number': 'LOT-9988',
            'quantity': 50,
            'unit': 'Bottles',
            'expiration_date': '2028-12-31'
        }
    )
    assert response.status_code == 201

def test_get_inventory(client, qa_token, app):
    with app.app_context():
        InventoryItem.query.delete()
        db.session.commit()

    client.post('/inventory', headers={'Authorization': f'Bearer {qa_token}'}, json={
        'name': 'Tyvek Suits', 'category': 'PPE', 'lot_number': 'L-11', 
        'quantity': 100, 'unit': 'Boxes', 'expiration_date': '2030-01-01'
    })

    response = client.get('/inventory', headers={'Authorization': f'Bearer {qa_token}'})
    assert response.status_code == 200
    assert response.get_json()[0]['lot_number'] == 'L-11'