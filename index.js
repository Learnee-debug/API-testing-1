const express = require('express');
const path = require('path');
const bodyParser = require('body-parser');
const fs = require('fs').promises;

const app = express();
const port = 3010;

// Middleware
app.use(bodyParser.json());

// Serve static files from the 'static' directory
app.use(express.static('static'));

// Serve static files from the 'pages' directory
app.use(express.static('pages'));

// Load students data from JSON file
async function loadStudentData() {
    try {
        const data = await fs.readFile('data.json', 'utf8');
        return JSON.parse(data);
    } catch (error) {
        console.error('Error loading student data:', error);
        return [];
    }
}

// Serve the homepage - updated to use absolute path
app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'pages', 'index.html'));
});

// Get all students
app.get('/students', async (req, res) => {
    try {
        const students = await loadStudentData();
        res.json(students);
    } catch (error) {
        res.status(500).json({ error: "Error retrieving student data" });
    }
});

// Retrieve students above the threshold
app.post('/students/above-threshold', async (req, res) => {
    try {
        const { threshold } = req.body;

        // Validate the threshold value
        if (typeof threshold !== 'number' || isNaN(threshold)) {
            return res.status(400).json({ 
                error: "Invalid threshold value. Please provide a valid number." 
            });
        }

        // Load and filter students
        const students = await loadStudentData();
        const filteredStudents = students.filter(student => student.total > threshold);

        // Respond with the filtered list
        res.json({
            count: filteredStudents.length,
            students: filteredStudents.map(student => ({
                student_id: student.student_id,
                name: student.name,
                total: student.total,
                marks: student.marks
            }))
        });
    } catch (error) {
        res.status(500).json({ 
            error: "Error processing request",
            details: error.message 
        });
    }
});

// Get student statistics
app.get('/students/statistics', async (req, res) => {
    try {
        const students = await loadStudentData();
        
        const stats = {
            totalStudents: students.length,
            averageTotal: students.reduce((acc, student) => acc + student.total, 0) / students.length,
            highestTotal: Math.max(...students.map(s => s.total)),
            lowestTotal: Math.min(...students.map(s => s.total))
        };
        
        res.json(stats);
    } catch (error) {
        res.status(500).json({ error: "Error calculating statistics" });
    }
});

// Get student by ID
app.get('/students/:id', async (req, res) => {
    try {
        const students = await loadStudentData();
        const student = students.find(s => s.student_id === req.params.id);
        
        if (!student) {
            return res.status(404).json({ error: "Student not found" });
        }
        
        res.json(student);
    } catch (error) {
        res.status(500).json({ error: "Error retrieving student" });
    }
});

// Error handler middleware
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Something broke!');
});

// Start the server
app.listen(port, () => {
    console.log(`Server running at http://localhost:${port}`);
});
