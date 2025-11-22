import { MigrationInterface, QueryRunner } from "typeorm";

export class FixDatabaseSchema1732267000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if tables exist before trying to modify them (for fresh database)
        const documentResultsTable = await queryRunner.getTable('document_results');
        const verificationSessionsTable = await queryRunner.getTable('verification_sessions');
        
        if (!documentResultsTable || !verificationSessionsTable) {
            // Tables don't exist yet, skip this migration (synchronize will create them)
            console.log('⚠️ Tables not found, skipping FixDatabaseSchema migration');
            return;
        }

        // Drop dependent views first (if they exist)
        await queryRunner.query(`DROP VIEW IF EXISTS complete_verifications CASCADE`);
        await queryRunner.query(`DROP VIEW IF EXISTS recent_verifications CASCADE`);
        await queryRunner.query(`DROP VIEW IF EXISTS successful_verifications CASCADE`);

        // Fix nationality and issuing_country column lengths in document_results
        // Only alter if columns exist
        const nationalityColumn = documentResultsTable.findColumnByName('nationality');
        const issuingCountryColumn = documentResultsTable.findColumnByName('issuing_country');
        
        if (nationalityColumn) {
            try {
                await queryRunner.query(`
                    ALTER TABLE "document_results" 
                    ALTER COLUMN "nationality" TYPE character varying(255)
                `);
            } catch (error) {
                console.log('⚠️ Could not alter nationality column:', error.message);
            }
        }
        
        if (issuingCountryColumn) {
            try {
                await queryRunner.query(`
                    ALTER TABLE "document_results" 
                    ALTER COLUMN "issuing_country" TYPE character varying(255)
                `);
            } catch (error) {
                console.log('⚠️ Could not alter issuing_country column:', error.message);
            }
        }

        // Update verification_sessions status check constraint
        await queryRunner.query(`
            ALTER TABLE "verification_sessions" 
            DROP CONSTRAINT IF EXISTS "chk_status"
        `);

        await queryRunner.query(`
            ALTER TABLE "verification_sessions" 
            ADD CONSTRAINT "chk_status" CHECK (status IN (
                'pending', 
                'in_progress', 
                'completed', 
                'failed', 
                'expired', 
                'awaiting_face_match', 
                'awaiting_liveness',
                'document_verified', 
                'face_verified'
            ))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert nationality and issuing_country column lengths
        await queryRunner.query(`
            ALTER TABLE "document_results" 
            ALTER COLUMN "nationality" TYPE character varying(3),
            ALTER COLUMN "issuing_country" TYPE character varying(3)
        `);

        // Revert verification_sessions status check constraint
        await queryRunner.query(`
            ALTER TABLE "verification_sessions" 
            DROP CONSTRAINT IF EXISTS "chk_status"
        `);

        await queryRunner.query(`
            ALTER TABLE "verification_sessions" 
            ADD CONSTRAINT "chk_status" CHECK (status IN (
                'pending', 
                'in_progress', 
                'completed', 
                'failed', 
                'expired'
            ))
        `);
    }

}

