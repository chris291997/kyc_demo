import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAuthenticityFieldsToFaceResults1763806000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if table exists
        const table = await queryRunner.getTable('face_results');
        if (!table) {
            console.log('⚠️ face_results table not found, skipping AddAuthenticityFieldsToFaceResults migration');
            return;
        }

        // Add columns one by one to avoid issues if some already exist
        const columns = [
            { name: 'authenticity_percentage', type: 'numeric(5,2)' },
            { name: 'etalon_image_path', type: 'character varying(500)' },
            { name: 'authenticity_image_path', type: 'character varying(500)' }
        ];

        for (const column of columns) {
            if (!table.findColumnByName(column.name)) {
                await queryRunner.query(`
                    ALTER TABLE "face_results" 
                    ADD COLUMN "${column.name}" ${column.type}
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "face_results" 
            DROP COLUMN IF EXISTS "authenticity_percentage",
            DROP COLUMN IF EXISTS "etalon_image_path",
            DROP COLUMN IF EXISTS "authenticity_image_path"
        `);
    }

}

