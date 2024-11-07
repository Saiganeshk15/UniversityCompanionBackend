const express = require('express');
const cors = require('cors');
const bodyParser = require('body-parser');
const { Pool } = require('pg');
const dotenv = require('dotenv');

dotenv.config();

const app = express();

app.use(cors());

app.use(bodyParser.json());

const pool = new Pool({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: process.env.DB_PORT,
});

app.listen(3000, () => {
    console.log('Server is running on port 3000');
});

app.get('/courses', async (req, res) => {
    try {
        const result = await pool.query('SELECT * FROM courses');
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching courses:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.post('/courses', async (req, res) => {
    const { course_name, professor, start_date, end_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO courses (course_name, professor, start_date, end_date) VALUES ($1, $2, $3, $4) RETURNING *',
            [course_name, professor, start_date, end_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error adding course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.patch('/course', async (req, res) => {
    const { course_name, professor, start_date, end_date, id } = req.body;
    try {
        const result = await pool.query(
            'UPDATE courses SET course_name = $1, professor = $2, start_date = $3, end_date = $4 WHERE id = $5',
            [course_name, professor, start_date, end_date, id]
        );
        res.status(201).json(result.rows[0]);
    } catch (e) {
        console.error(`Failed to update course:`, e);
        res.status(500).json({ error: 'Internal server error' });
    }
});

app.delete(`/course/:courseId`, async (req, res) => {
    const courseId = req.params.courseId;
    try {
        const result = await pool.query(
            `DELETE FROM courses WHERE id = $1 RETURNING *`,
            [Number(courseId)]
        );
        res.status(200).json(result.rows[0]);
    } catch (e) {
        console.error(`Failed to delete course: `, e);
        res.status(500).send('Server error');
    }
});

app.post('/assignments', async (req, res) => {
    const { course_id, title, due_date } = req.body;
    try {
        const result = await pool.query(
            'INSERT INTO assignments (course_id, title, due_date) VALUES ($1, $2, $3) RETURNING *',
            [course_id, title, due_date]
        );
        res.status(201).json(result.rows[0]);
    } catch (error) {
        console.error('Error creating assignment:', error);
        res.status(500).send('Server error');
    }
});

app.patch(`/assignments`, async (req, res) => {
    const data = req.body;
    const result = await pool.query(
        'UPDATE assignments SET title = $1, due_date = $2 WHERE id = $3',
        [data.title, data.due_date, data.id]
    );
    res.status(200).json(result.rows[0]);
});

app.delete('/assignment/:id', async (req, res) => {
    const id = req.params.id;
    const result = await pool.query(
        `DELETE FROM assignments WHERE id = $1 RETURNING *`,
        [id]
    )
    res.status(200).json(result.rows[0]);
});

app.patch('/assignments/:id', async (req, res) => {
    const { id } = req.params;
    const { status } = req.body;
    const result = await pool.query(
        'UPDATE assignments SET status = $1 WHERE id = $2 RETURNING *',
        [status, id]
    );
    res.status(200).json(result.rows[0]);
});

app.get(`/courses/:courseId/assignments`, async (req, res) => {
    let { courseId } = req.params;
    courseId = Number(courseId);
    try {
        const result = await pool.query(
            'SELECT * FROM assignments WHERE course_id = $1', 
            [courseId]
        );
        res.json(result.rows);
    } catch (error) {
        console.error('Error fetching assignments for course:', error);
        res.status(500).json({ error: 'Internal server error' });
    }
});


