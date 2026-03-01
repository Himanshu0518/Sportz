
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import http from 'http';
import dotenv from 'dotenv';
import {setupWebSocketServer} from './ws/server.js';
dotenv.config();

const app = express();
const PORT = process.env.PORT || 8000;
const HOST = process.env.HOST || 'localhost';
const server=http.createServer(app);
const {broadcastMatchCreation} =setupWebSocketServer(server);
app.locals.broadcastMatchCreation = broadcastMatchCreation;

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

server.listen(PORT, HOST, () => {
	
	console.log(`Server listening on port ${PORT}`);
});
