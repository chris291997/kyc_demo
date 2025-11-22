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
  document_type: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  document_type_code: string;

  @Column({ type: 'varchar', length: 100, nullable: true })
  document_number: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  full_name: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  given_names: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  surname: string;

  @Column({ type: 'date', nullable: true })
  date_of_birth: Date;

  @Column({ type: 'varchar', length: 20, nullable: true })
  gender: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  nationality: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuing_country: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  issuing_authority: string;

  @Column({ type: 'date', nullable: true })
  issue_date: Date;

  @Column({ type: 'date', nullable: true })
  expiry_date: Date;

  @Column({ type: 'varchar', length: 500, nullable: true })
  face_image_path: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  document_image_path: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  place_of_birth: string;

  @Column({ type: 'varchar', length: 255, nullable: true })
  address: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  personal_number: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  age: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  authenticity_status: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  authenticity_score: number;

  @Column({ type: 'boolean', nullable: true })
  mrz_verified: boolean;

  @Column({ type: 'boolean', nullable: true })
  barcode_verified: boolean;

  @Column({ type: 'jsonb', nullable: true })
  raw_response: any;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VerificationSession, (session) => session.document_results)
  @JoinColumn({ name: 'session_id' })
  verification_session: VerificationSession;
}

