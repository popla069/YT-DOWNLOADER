const express = require('express');
const cors = require('cors');
const { exec } = require('child_process');
const path = require('path');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.json());

// Route to download YouTube video in different formats/qualities
app.post('/download', (req, res) => {
    const videoUrl = req.body.url;
    const format = req.body.format || 'best'; // Default to best format if not provided

    if (!videoUrl) {
        return res.status(400).json({ error: 'No video URL provided' });
    }

    // Use yt-dlp to download video
    const command = `yt-dlp -f ${format} -o "downloads/%(title)s.%(ext)s" ${videoUrl}`;
    
    exec(command, (error, stdout, stderr) => {
        if (error) {
            console.error(`Error: ${error.message}`);
            return res.status(500).json({ error: 'Error downloading video' });
        }
        
        // Find the downloaded file name (from yt-dlp output)
        const match = stdout.match(/Destination:\s(.*)/);
        if (match && match[1]) {
            const filePath = match[1].trim();
            const fileName = path.basename(filePath);
            
            res.json({ 
                message: 'Video downloaded successfully', 
                fileName: fileName,
                filePath: filePath
            });
        } else {
            res.status(500).json({ error: 'Error finding downloaded file' });
        }
    });
});

// Serve the downloaded file
app.get('/downloads/:fileName', (req, res) => {
    const fileName = req.params.fileName;
    const filePath = path.join(__dirname, 'downloads', fileName);

    res.download(filePath, (err) => {
        if (err) {
            console.error(`Error sending file: ${err}`);
            res.status(404).send('File not found');
        }
    });
});

app.listen(PORT, () => {
    console.log(`Server running on http://localhost:${PORT}`);
});
