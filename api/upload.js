import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({
    cloud_name: process.env.CLOUDINARY_CLOUD_NAME,
    api_key: process.env.CLOUDINARY_API_KEY,
    api_secret: process.env.CLOUDINARY_API_SECRET,
});

export const config = { api: { bodyParser: { sizeLimit: '100mb' } } };

export default async function handler(req, res) {
    if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });
    try {
        const { file, resource_type } = req.body;
        const result = await cloudinary.uploader.upload(file, {
            resource_type: resource_type || 'auto',
            folder: 'admsocial'
        });
        return res.json({ success: true, url: result.secure_url, resource_type: result.resource_type });
    } catch (err) {
        return res.status(500).json({ success: false, error: err.message });
    }
}
