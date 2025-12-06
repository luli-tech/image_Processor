import { Body, Controller, Post, Get, Param, NotFoundException } from '@nestjs/common';
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

  @Get(':apiKey')
  @ApiOperation({ summary: 'Get project info by API Key' })
  async get(@Param('apiKey') apiKey: string) {
      const project = await this.projectsService.findByApiKey(apiKey);
      if (!project) throw new NotFoundException('Project not found');
      return project;
  }
}
