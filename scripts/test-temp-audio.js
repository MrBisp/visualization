async function testTempAudio() {
    try {
        const testId = `test-${Date.now()}`;
        console.log('Testing with ID:', testId);

        const response = await fetch('http://localhost:3000/api/generation/complete-temp/test', {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
            },
            body: JSON.stringify({ id: testId })
        });

        const data = await response.json();
        
        if (!response.ok) {
            throw new Error(`HTTP error! status: ${response.status}, message: ${data.error || 'Unknown error'}`);
        }

        console.log('Response:', data);
        console.log('\nTesting audio URL...');
        console.log('URL:', data.audio_url);

        // Test if we can fetch the audio file
        const audioResponse = await fetch(data.audio_url);
        if (!audioResponse.ok) {
            throw new Error(`Failed to fetch audio: ${audioResponse.status} ${audioResponse.statusText}`);
        }
        
        console.log('✅ Successfully fetched audio file');
        console.log('\nTest completed successfully!');

    } catch (error) {
        console.error('❌ Test failed:', error.message);
    }
}

testTempAudio(); 