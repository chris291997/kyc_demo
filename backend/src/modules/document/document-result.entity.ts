import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VerificationSession } from '../verification/verification.entity';

@Entity('document_results')
export class DocumentResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  document_type: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  document_type_code: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  document_name: string | null;

  @Column({ type: 'varchar', length: 100, nullable: true })
  document_number: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  full_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  given_names: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  surname: string | null;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date | null;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nationality: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuing_country: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuing_state_name: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuing_authority: string | null;

  @Column({ type: 'date', nullable: true })
  issue_date: Date | null;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  face_image_path: string | null;

  @Column({ type: 'varchar', length: 500, nullable: true })
  document_image_path: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  place_of_birth: string | null;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  personal_number: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  age: string | null;

  @Column({ type: 'varchar', length: 50, nullable: true })
  authenticity_status: string | null;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  authenticity_score: number | null;

  @Column({ type: 'boolean', nullable: true })
  mrz_verified: boolean | null;

  @Column({ type: 'boolean', nullable: true })
  barcode_verified: boolean | null;

  @Column({ type: 'jsonb', nullable: true })
  raw_response: any;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VerificationSession, (session) => session.document_results)
  @JoinColumn({ name: 'session_id' })
  verification_session: VerificationSession;
}

