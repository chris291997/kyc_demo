import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  ManyToOne,
  JoinColumn,
} from 'typeorm';
import { VerificationSession } from '../verification/verification.entity';

@Entity('face_results')
export class FaceResult {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({ type: 'uuid' })
  session_id: string;

  @Column({ type: 'varchar', length: 50, nullable: true })
  liveness_status: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  liveness_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  liveness_confidence: number;

  @Column({ type: 'varchar', length: 50, nullable: true })
  match_status: string;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  match_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  similarity_score: number;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  face_quality_score: number;

  @Column({ type: 'boolean', nullable: true })
  face_detected: boolean;

  @Column({ type: 'int', nullable: true })
  face_count: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  selfie_image_path: string;

  @Column({ type: 'jsonb', nullable: true })
  raw_liveness_response: any;

  @Column({ type: 'jsonb', nullable: true })
  raw_match_response: any;

  @Column({ type: 'decimal', precision: 5, scale: 2, nullable: true })
  authenticity_percentage: number;

  @Column({ type: 'varchar', length: 500, nullable: true })
  etalon_image_path: string;

  @Column({ type: 'varchar', length: 500, nullable: true })
  authenticity_image_path: string;

  @CreateDateColumn()
  created_at: Date;

  @ManyToOne(() => VerificationSession, (session) => session.face_results)
  @JoinColumn({ name: 'session_id' })
  verification_session: VerificationSession;
}

