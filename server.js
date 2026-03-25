import express from 'express';
import fs from 'fs';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json({ limit: '10mb' })); // Limit increased just in case

// Usar la ruta de .env (Ej: Z:\Compartido\hemiciclo_datos.json)
// Si no existe, guarda localmente en la carpeta del proyecto
const DB_FILE = process.env.NETWORK_DB_PATH || path.join(process.cwd(), 'hemiciclo_datos.json');

// Leer la base de datos (un simple JSON)
function readDB() {
    try {
        if (fs.existsSync(DB_FILE)) {
            const data = fs.readFileSync(DB_FILE, 'utf8');
            return JSON.parse(data);
        }
    } catch (err) {
        console.error("Error leyendo en red:", err);
    }
    return {};
}

// Escribir en la base de datos
function writeDB(data) {
    try {
        // Nos aseguramos de que el directorio exista si es red
        const dir = path.dirname(DB_FILE);
        if (!fs.existsSync(dir)) {
            fs.mkdirSync(dir, { recursive: true });
        }
        fs.writeFileSync(DB_FILE, JSON.stringify(data, null, 2));
    } catch (err) {
        console.error("Error escribiendo en red:", err);
    }
}

app.get('/api/data', (req, res) => {
    const db = readDB();
    const key = req.query.key;
    if (key) {
        res.json({ value: db[key] });
    } else {
        res.json(db);
    }
});

app.post('/api/data', (req, res) => {
    const db = readDB();
    const { key, value } = req.body;
    
    if (key && value !== undefined) {
        db[key] = value;
        writeDB(db);
        res.json({ success: true });
    } else {
        res.status(400).json({ error: 'Invalid payload' });
    }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, '0.0.0.0', () => {
    console.log(`\n======================================================`);
    console.log(`🚀 Backend de Red Iniciado en el puerto ${PORT}`);
    console.log(`📁 Guardando datos en: ${DB_FILE}`);
    console.log(`======================================================\n`);
});
