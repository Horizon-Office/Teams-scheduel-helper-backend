import { ApiProperty } from '@nestjs/swagger';
import { IsArray, IsNotEmpty, IsOptional, IsString, ValidateNested } from 'class-validator';
import { Type } from 'class-transformer';

class TeamMemberDto {
  @ApiProperty({ example: '#microsoft.graph.aadUserConversationMember' })
  @IsNotEmpty()
  @IsString()
  '@odata.type': string;

  @ApiProperty({ example: ['owner'] })
  @IsArray()
  roles: string[];

  @ApiProperty({ example: 'https://graph.microsoft.com/v1.0/users("8134b755-cc30-4a21-ba3c-b792a8d3820b")' })
  @IsNotEmpty()
  @IsString()
  'user@odata.bind': string;
}

export class CreateTeamDto {
  @ApiProperty({ example: "https://graph.microsoft.com/v1.0/teamsTemplates('standard')" })
  @IsNotEmpty()
  @IsString()
  'template@odata.bind': string;

  @IsString()
  @IsNotEmpty()
  department: string; 
  
  @ApiProperty({ example: '121-24-1 Дискретна Математика Практика' })
  @IsNotEmpty()
  @IsString()
  displayName: string;

  @ApiProperty({ example: "My sample team's description" })
  @IsOptional()
  @IsString()
  description?: string;

  @ApiProperty({ type: TeamMemberDto })
  @ValidateNested()
  @Type(() => TeamMemberDto)
  member: TeamMemberDto;
}