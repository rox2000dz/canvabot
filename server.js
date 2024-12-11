import express from 'express';
import cors from 'cors';
import { Client, GatewayIntentBits, EmbedBuilder } from 'discord.js';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();

const client = new Client({ 
    intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions
    ] 
});

const BOT_TOKEN = '';
const SUGGESTIONS_CHANNEL_ID = '';
const PORT = process.env.PORT || 1111;
const DOMAIN = process.env.DOMAIN || '';

const userCooldowns = new Map();
const COOLDOWN_TIME = 60 * 60 * 1000; 

client.login(BOT_TOKEN);

client.once('ready', () => {
    console.log(`Bot is ready! Logged in as ${client.user.tag}`);
});

app.use(cors({
    origin: DOMAIN,
    credentials: true
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'suggestions.html'));
});

app.get('/callback', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'suggestions.html'));
});

app.post('/api/suggestions', async (req, res) => {
    try {
        const { userId, username, avatar, title, description } = req.body;
                const lastSuggestionTime = userCooldowns.get(userId);
        const now = Date.now();
        
        if (lastSuggestionTime && (now - lastSuggestionTime) < COOLDOWN_TIME) {
            const timeLeft = Math.ceil((COOLDOWN_TIME - (now - lastSuggestionTime)) / 1000 / 60);
            return res.status(429).json({ 
                error: `يرجى الانتظار ${timeLeft} دقيقة قبل إرسال اقتراح آخر`
            });
        }
        
        const channel = await client.channels.fetch(SUGGESTIONS_CHANNEL_ID);
        const guild = channel.guild;
        
        const bannerURL = guild.bannerURL({ size: 4096 }) || null;
        
        const suggestionEmbed = new EmbedBuilder()
            .setTitle("New Suggestion")
            .setColor(0x8B0000)
            .addFields(
                { name: "Suggested By", value: `<@${userId}> (${username})`, inline: true },
                { name: "Title", value: title },
                { name: "Description", value: description }
            )
            .setTimestamp()
            .setThumbnail(`https://cdn.discordapp.com/avatars/${userId}/${avatar}.png`)
            .setFooter({
                text: guild.name,
                iconURL: guild.iconURL({ dynamic: true })
            });

        if (bannerURL) {
            suggestionEmbed.setImage(bannerURL);
        }

        const message = await channel.send({
            embeds: [suggestionEmbed]
        });

        await message.react('✅');
        await message.react('❌');

        userCooldowns.set(userId, now);

        res.status(200).json({ message: 'تم إرسال اقتراحك بنجاح' });
    } catch (error) {
        console.error('Error:', error);
        res.status(500).json({ error: 'حدث خطأ أثناء إرسال الاقتراح' });
    }
});

process.on('uncaughtException', (error) => {
    console.error('Uncaught Exception:', error);
    if (error.cause) {
        console.error('Caused by:', error.cause);
    }
});

process.on('unhandledRejection', (reason, promise) => {
    console.error('Unhandled Rejection at:', promise);
    console.error('Reason:', reason);
});

const checkInternet = async () => {
    try {
        await new Promise((resolve, reject) => {
            require('dns').lookup('discord.com', (err) => {
                if (err) reject(err);
                else resolve();
            });
        });
    } catch (err) {
        if (err.code === "ENOTFOUND") {
            console.log('No internet connection! Retrying in 5 seconds...');
            setTimeout(checkInternet, 5000);
        }
    }
};

await checkInternet();

app.listen(PORT, '0.0.0.0', () => {
    console.log(`Server running on ${DOMAIN}`);
    console.log(`Node.js version: ${process.version}`);
}); 