import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../mongooseShema/project.schema';
import { v4 as uuidv4 } from 'uuid';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(
    @InjectModel(Project.name) private projectModel: Model<Project>,
  ) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
    const apiKey = uuidv4();
    const { name, cloudinaryConfig } = createProjectDto;
    const existingProject = await this.projectModel.findOne({ name }).exec();
    if (existingProject) {
      throw new Error('Project name already exists');
    }
    const newProject = new this.projectModel({
      name,
      apiKey,
      cloudinaryConfig,
    });
    return newProject.save();
  }
  async findByName(name: string): Promise<Project | null> {
    return this.projectModel.findOne({ name }).exec();
  }

  async findByApiKey(apiKey: string): Promise<Project | null> {
    return this.projectModel.findOne({ apiKey }).exec();
  }
  async findAll(): Promise<Project[]> {
    return this.projectModel.find().exec();
  }

  async deleteByApiKey(apiKey: string): Promise<void> {
    const result = await this.projectModel.deleteOne({ apiKey }).exec();
    if (result.deletedCount === 0) {
      throw new Error('Project not found or already deleted');
    }
  }
}
