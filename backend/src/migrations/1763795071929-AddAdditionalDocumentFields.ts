import { MigrationInterface, QueryRunner } from "typeorm";

export class AddAdditionalDocumentFields1763795071929 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if table exists
        const table = await queryRunner.getTable('document_results');
        if (!table) {
            console.log('⚠️ document_results table not found, skipping AddAdditionalDocumentFields migration');
            return;
        }

        // Add columns one by one to avoid issues if some already exist
        const columns = [
            { name: 'place_of_birth', type: 'character varying(255)' },
            { name: 'address', type: 'character varying(255)' },
            { name: 'personal_number', type: 'character varying(50)' },
            { name: 'age', type: 'character varying(50)' }
        ];

        for (const column of columns) {
            if (!table.findColumnByName(column.name)) {
                await queryRunner.query(`
                    ALTER TABLE "document_results" 
                    ADD COLUMN "${column.name}" ${column.type}
                `);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "document_results" 
            DROP COLUMN IF EXISTS "place_of_birth",
            DROP COLUMN IF EXISTS "address",
            DROP COLUMN IF EXISTS "personal_number",
            DROP COLUMN IF EXISTS "age"
        `);
    }

}
