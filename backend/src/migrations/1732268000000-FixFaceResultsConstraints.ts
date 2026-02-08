import { MigrationInterface, QueryRunner } from "typeorm";

export class FixFaceResultsConstraints1732268000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Drop existing match_status constraint
        await queryRunner.query(`
            ALTER TABLE "face_results" 
            DROP CONSTRAINT IF EXISTS "chk_match_status"
        `);

        // Add updated constraint that includes both 'match'/'no_match' and 'matched'/'not_matched'
        await queryRunner.query(`
            ALTER TABLE "face_results" 
            ADD CONSTRAINT "chk_match_status" CHECK (match_status IN (
                'match',
                'no_match', 
                'matched', 
                'not_matched', 
                'unknown', 
                'not_checked'
            ))
        `);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        // Revert to original constraint
        await queryRunner.query(`
            ALTER TABLE "face_results" 
            DROP CONSTRAINT IF EXISTS "chk_match_status"
        `);

        await queryRunner.query(`
            ALTER TABLE "face_results" 
            ADD CONSTRAINT "chk_match_status" CHECK (match_status IN (
                'matched', 
                'not_matched', 
                'unknown', 
                'not_checked'
            ))
        `);
    }

}

