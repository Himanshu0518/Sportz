
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';

const app = express();
const PORT = 8000;

// Middleware
app.use(cors());
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(helmet());
app.use(morgan('combined'));

// Simple route
app.get('/', (req, res) => {
	res.send('Express server is running!');
});


import { matchesRouter } from './routes/matches.js';
app.use('/matches', matchesRouter);

app.listen(PORT, () => {
	console.log(`Server listening on port ${PORT}`);
});
