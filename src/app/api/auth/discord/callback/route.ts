// app/api/auth/discord/callback/route.ts
import { NextResponse } from 'next/server';
import axios from 'axios';

const DISCORD_CLIENT_ID = '1306227974579949568'; // Replace with your Discord client ID
const DISCORD_CLIENT_SECRET = 'JSqkD5RNC3U8JVMJX9IRxTxZxiTWwgdz'; // Replace with your Discord client secret
const DISCORD_REDIRECT_URI = 'https://dragonft.org/api/auth/discord/callback'; // Ensure this matches your redirect URI

export async function GET(req: Request) {
    const { searchParams } = new URL(req.url);
    const code = searchParams.get('code');

    if (!code) {
        return NextResponse.json({ error: 'No code provided' }, { status: 400 });
    }

    try {
        // Exchange code for access token
        const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', new URLSearchParams({
            client_id: DISCORD_CLIENT_ID,
            client_secret: DISCORD_CLIENT_SECRET,
            grant_type: 'authorization_code',
            code: code,
            redirect_uri: DISCORD_REDIRECT_URI,
        }), {
            headers: {
                'Content-Type': 'application/x-www-form-urlencoded',
            },
        });

        const accessToken = tokenResponse.data.access_token;

        // Fetch user information
        const userResponse = await axios.get('https://discord.com/api/users/@me', {
            headers: {
                Authorization: `Bearer ${accessToken}`,
            },
        });
        const discordId = userResponse.data.id;

        // Redirect back to your page with the Discord ID
        return NextResponse.redirect(`https://dragonft.org/profile/add_id_discord?discordId=${discordId}`);
    } catch (error) {
        console.error('Error during Discord OAuth2 flow:', error);
        return NextResponse.json({ error: 'Failed to authenticate' }, { status: 500 });
    }
}