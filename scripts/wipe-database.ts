/**
 * MongoDB Database Wipe Script
 * 
 * This script connects to the MongoDB cluster and drops all collections
 * to prepare the database for the Fluxxx project.
 * 
 * Usage: npx tsx scripts/wipe-database.ts
 */

import 'dotenv/config';
import mongoose from 'mongoose';
import * as readline from 'readline';

const MONGODB_URI = process.env.MONGODB_URI || '';

async function promptConfirmation(): Promise<boolean> {
    const rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout,
    });

    return new Promise((resolve) => {
        rl.question(
            '\n⚠️  WARNING: This will DELETE ALL DATA in the database!\n' +
            'Are you sure you want to continue? (yes/no): ',
            (answer) => {
                rl.close();
                resolve(answer.toLowerCase() === 'yes');
            }
        );
    });
}

async function wipeDatabase() {
    console.log('\n🗄️  MongoDB Database Wipe Script');
    console.log('================================\n');

    if (!MONGODB_URI) {
        console.error('❌ MONGODB_URI environment variable is not set!');
        console.log('   Set it in your .env file or pass it as an environment variable.');
        process.exit(1);
    }

    // Confirm before proceeding
    const confirmed = await promptConfirmation();
    if (!confirmed) {
        console.log('\n✅ Operation cancelled. No data was deleted.');
        process.exit(0);
    }

    try {
        console.log('\n🔗 Connecting to MongoDB...');
        await mongoose.connect(MONGODB_URI);
        console.log('✅ Connected successfully!\n');

        const db = mongoose.connection.db;
        if (!db) {
            throw new Error('Database connection not established');
        }

        // Get all collections
        const collections = await db.listCollections().toArray();

        if (collections.length === 0) {
            console.log('📭 Database is already empty. Nothing to delete.');
        } else {
            console.log(`📋 Found ${collections.length} collection(s):\n`);

            for (const collection of collections) {
                console.log(`   🗑️  Dropping: ${collection.name}`);
                await db.dropCollection(collection.name);
            }

            console.log(`\n✅ Successfully dropped ${collections.length} collection(s)!`);
        }

        console.log('\n🎉 Database is now clean and ready for Fluxxx!\n');

    } catch (error) {
        console.error('\n❌ Error:', error);
        process.exit(1);
    } finally {
        await mongoose.disconnect();
        console.log('🔌 Disconnected from MongoDB.');
    }
}

wipeDatabase();
