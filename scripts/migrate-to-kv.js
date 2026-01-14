// Run this once to migrate your data to Vercel KV
// Usage: node scripts/migrate-to-kv.js

const fs = require('fs');
const path = require('path');

const EDIT_PASSWORD = process.env.EDIT_PASSWORD || 'donotstealbroplS7!';
const API_URL = 'https://www.enrinjr.com/api/content';

async function migrate() {
    try {
        // Read local data
        const thoughts = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/thoughts.json'), 'utf8'));
        const timeline = JSON.parse(fs.readFileSync(path.join(__dirname, '../data/timeline.json'), 'utf8'));

        console.log(`Found ${thoughts.length} thoughts and ${timeline.length} timeline entries`);

        // Upload each thought individually
        for (const thought of thoughts.reverse()) {
            const response = await fetch(`${API_URL}?type=thoughts`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${EDIT_PASSWORD}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    date: thought.date,
                    tag: thought.tag,
                    title: thought.title,
                    preview: thought.preview
                })
            });

            const result = await response.json();
            if (response.ok) {
                console.log(`✓ Migrated thought: ${thought.title}`);
            } else {
                console.error(`✗ Failed to migrate thought: ${thought.title}`, result);
            }
        }

        // Upload each timeline entry individually
        for (const entry of timeline.reverse()) {
            const response = await fetch(`${API_URL}?type=timeline`, {
                method: 'POST',
                headers: {
                    'Authorization': `Bearer ${EDIT_PASSWORD}`,
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    period: entry.period,
                    title: entry.title,
                    description: entry.description,
                    tags: entry.tags
                })
            });

            const result = await response.json();
            if (response.ok) {
                console.log(`✓ Migrated timeline: ${entry.title}`);
            } else {
                console.error(`✗ Failed to migrate timeline: ${entry.title}`, result);
            }
        }

        console.log('\n✅ Migration complete!');
    } catch (error) {
        console.error('Migration failed:', error);
    }
}

migrate();
