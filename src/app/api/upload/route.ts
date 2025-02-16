import { NextRequest, NextResponse } from 'next/server';
import { v2 as cloudinary } from 'cloudinary';

cloudinary.config({ 
    cloud_name: 'dg4wrriuq', 
    api_key: '899743248258233', 
    api_secret: process.env.CLOUDINARY_API_SECRET
});

type CloudinaryUploadResult = {
    secure_url: string;
};

export async function POST(request: NextRequest) {
    const formData = await request.formData();
    const file = formData.get('file') as File;

    if (!file) {
        return NextResponse.json({ error: 'No file uploaded' }, { status: 400 });
    }

    try {
        const arrayBuffer = await file.arrayBuffer();
        const buffer = Buffer.from(arrayBuffer);

        const result = await new Promise<CloudinaryUploadResult>((resolve, reject) => {
            cloudinary.uploader.upload_stream({ resource_type: 'auto' }, (error, result) => {
                if (error) reject(error);
                else resolve(result as CloudinaryUploadResult);
            }).end(buffer);
        });

        return NextResponse.json({ url: result.secure_url });
    } catch (error) {
        console.error('Error uploading to Cloudinary:', error);
        return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
    }
}