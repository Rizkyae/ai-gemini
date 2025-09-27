<<<<<<< HEAD
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Hash password sebelum disimpan
        const passwordHash = await bcrypt.hash(password, 10);

        // Simpan user ke database
        await sql`
            INSERT INTO users (email, password_hash)
            VALUES (${email}, ${passwordHash});
        `;

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        // Tangani error jika email sudah ada (karena UNIQUE constraint)
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Email already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
=======
import { sql } from '@vercel/postgres';
import bcrypt from 'bcryptjs';

export default async function handler(req, res) {
    if (req.method !== 'POST') {
        return res.status(405).json({ message: 'Method Not Allowed' });
    }

    try {
        const { email, password } = req.body;

        if (!email || !password) {
            return res.status(400).json({ message: 'Email and password are required' });
        }

        // Hash password sebelum disimpan
        const passwordHash = await bcrypt.hash(password, 10);

        // Simpan user ke database
        await sql`
            INSERT INTO users (email, password_hash)
            VALUES (${email}, ${passwordHash});
        `;

        res.status(201).json({ message: 'User registered successfully' });
    } catch (error) {
        // Tangani error jika email sudah ada (karena UNIQUE constraint)
        if (error.code === '23505') {
            return res.status(409).json({ message: 'Email already exists' });
        }
        console.error(error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
}
>>>>>>> b78b6b7cbe0c8ec7bbc3bf5732f4f35ebd27d452
