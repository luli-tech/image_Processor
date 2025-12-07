import {
  Body,
  Controller,
  Delete,
  Post,
  Get,
  Param,
  NotFoundException,
} from '@nestjs/common';
import { ProjectsService } from './projects.service';
import { ApiTags, ApiOperation, ApiResponse, ApiBody } from '@nestjs/swagger';
import { CreateProjectDto } from './dto/create-project.dto';

@ApiTags('projects')
@Controller('projects')
export class ProjectsController {
  constructor(private readonly projectsService: ProjectsService) {}

  @Post()
  @ApiOperation({ summary: 'Create a new project' })
  @ApiBody({ type: CreateProjectDto })
  async create(@Body() createProjectDto: CreateProjectDto) {
    return this.projectsService.create(createProjectDto);
  }
  @Get('name/:name')
  @ApiOperation({ summary: 'Get project info by project name' })
  async getByName(@Param('name') name: string) {
    const project = await this.projectsService.findByName(name);
    if (!project) throw new NotFoundException('Project not found');

    return {
      name: project.name,
      apiKey: project.apiKey,
      cloudinaryConfig: project.cloudinaryConfig,
    };
  }
  @Get(':apiKey')
  @ApiOperation({ summary: 'Get project info by API Key' })
  async get(@Param('apiKey') apiKey: string) {
    const project = await this.projectsService.findByApiKey(apiKey);
    if (!project) throw new NotFoundException('Project not found');
    return {
      name: project.name,
      apiKey: project.apiKey,
      cloudinaryConfig: project.cloudinaryConfig,
    };
  }
  @Get()
  @ApiOperation({ summary: 'Get all projects' })
  async findAll() {
    return this.projectsService.findAll();
  }
  @Delete(':apiKey')
  @ApiOperation({ summary: 'Delete a project by API Key' })
  async delete(@Param('apiKey') apiKey: string) {
    await this.projectsService.deleteByApiKey(apiKey);
    return { message: 'Project deleted successfully' };
  }
}
