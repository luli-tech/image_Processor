import { Injectable } from '@nestjs/common';
import { InjectModel } from '@nestjs/mongoose';
import { Model } from 'mongoose';
import { Project } from '../mongooseShema/project.schema';
import { v4 as uuidv4 } from 'uuid';
import { CreateProjectDto } from './dto/create-project.dto';

@Injectable()
export class ProjectsService {
  constructor(@InjectModel(Project.name) private projectModel: Model<Project>) {}

  async create(createProjectDto: CreateProjectDto): Promise<Project> {
      const apiKey = uuidv4();
      const newProject = new this.projectModel({
          name: createProjectDto.name,
          apiKey,
          cloudinaryConfig: createProjectDto.cloudinaryConfig,
      });
      return newProject.save();
  }

  async findByApiKey(apiKey: string): Promise<Project | null> {
      return this.projectModel.findOne({ apiKey }).exec();
  }
}
