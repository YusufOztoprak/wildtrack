
async function testNoImage() {
    try {
        console.log('🧪 Testing Observation WITHOUT Image...');
        const token = await getToken();

        const response = await fetch('http://localhost:3000/api/observations', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': 'Bearer ' + token
            },
            body: JSON.stringify({
                species: 'Wolf',
                count: 1,
                latitude: 40.0,
                longitude: 30.0,
                behavior: 'Hunting'
            })
        });

        const data = await response.json();

        if (response.ok) {
            console.log('✅ Success:', response.status, data.message);
        } else {
            console.error('❌ Failed:', data);
        }

    } catch (e) {
        console.error('❌ Validation Script Error:', e);
    }
}

async function getToken() {
    // fast login
    try {
        const response = await fetch('http://localhost:3000/api/auth/register', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                name: 'Test',
                email: 'test' + Date.now() + '@test.com',
                password: 'password'
            })
        });
        const data = await response.json();
        return data.token;
    } catch (e) {
        return '';
    }
}

testNoImage();
