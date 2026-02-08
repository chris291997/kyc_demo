import { MigrationInterface, QueryRunner } from "typeorm";

export class AddLivenessFieldsToFaceResults1763846000000 implements MigrationInterface {

    public async up(queryRunner: QueryRunner): Promise<void> {
        // Check if table exists
        const table = await queryRunner.getTable('face_results');
        if (!table) {
            console.log('⚠️ face_results table not found, skipping AddLivenessFieldsToFaceResults migration');
            return;
        }

        // Add columns one by one to avoid issues if some already exist
        const columns = [
            { name: 'liveness_transaction_id', type: 'character varying(255)', nullable: true },
            { name: 'liveness_tag', type: 'character varying(255)', nullable: true },
            { name: 'liveness_type', type: 'integer', nullable: true },
            { name: 'liveness_estimated_age', type: 'integer', nullable: true },
            { name: 'liveness_code', type: 'integer', nullable: true },
            { name: 'liveness_metadata', type: 'jsonb', nullable: true },
            { name: 'liveness_images', type: 'jsonb', nullable: true }
        ];

        for (const column of columns) {
            if (!table.findColumnByName(column.name)) {
                const nullableClause = column.nullable ? 'NULL' : 'NOT NULL';
                await queryRunner.query(`
                    ALTER TABLE "face_results" 
                    ADD COLUMN "${column.name}" ${column.type} ${nullableClause}
                `);
            } else {
                console.log(`⚠️ Column "${column.name}" already exists, skipping`);
            }
        }
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`
            ALTER TABLE "face_results" 
            DROP COLUMN IF EXISTS "liveness_transaction_id",
            DROP COLUMN IF EXISTS "liveness_tag",
            DROP COLUMN IF EXISTS "liveness_type",
            DROP COLUMN IF EXISTS "liveness_estimated_age",
            DROP COLUMN IF EXISTS "liveness_code",
            DROP COLUMN IF EXISTS "liveness_metadata",
            DROP COLUMN IF EXISTS "liveness_images"
        `);
    }

}

