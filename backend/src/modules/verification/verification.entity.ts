import {
  Entity,
  Column,
  PrimaryGeneratedColumn,
  CreateDateColumn,
  UpdateDateColumn,
  OneToMany,
} from 'typeorm';
import { DocumentResult } from '../document/document-result.entity';
import { FaceResult } from '../face/face-result.entity';

@Entity('verification_sessions')
export class VerificationSession {
  @PrimaryGeneratedColumn('uuid')
  id: string;

  @Column({
    type: 'varchar',
    length: 50,
    default: 'pending',
  })
  status: string;

  @Column({
    type: 'boolean',
    default: false,
  })
  document_verified: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  liveness_passed: boolean;

  @Column({
    type: 'boolean',
    default: false,
  })
  face_matched: boolean;

  @Column({
    type: 'decimal',
    precision: 5,
    scale: 2,
    nullable: true,
  })
  match_score: number;

  @Column({
    type: 'varchar',
    length: 255,
    nullable: true,
  })
  user_identifier: string;

  @Column({
    type: 'jsonb',
    nullable: true,
  })
  metadata: any;

  @CreateDateColumn()
  created_at: Date;

  @UpdateDateColumn()
  updated_at: Date;

  @OneToMany(
    () => DocumentResult,
    (documentResult) => documentResult.verification_session,
  )
  document_results: DocumentResult[];

  @OneToMany(() => FaceResult, (faceResult) => faceResult.verification_session)
  face_results: FaceResult[];
}

