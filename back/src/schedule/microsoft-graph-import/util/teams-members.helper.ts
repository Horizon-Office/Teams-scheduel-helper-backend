import axios from 'axios';
import { MicrosoftGraphSecurityClientService, GraphUserResponse } from 'src/client/microsoft_graph/microsoft_graph_security.service';

const GRAPH_BASE_URL = 'https://graph.microsoft.com/v1.0';

export async function getMembersByDepartment(
  graphClient: MicrosoftGraphSecurityClientService,
  department: string,
): Promise<GraphUserResponse[]> {
  const token = await graphClient.getAppToken();

  const response = await axios.get<{ value: GraphUserResponse[] }>(
    `${GRAPH_BASE_URL}/users`,
    {
      headers: {
        Authorization: `Bearer ${token}`,
        ConsistencyLevel: 'eventual',
      },
      params: {
        $filter: `department eq '${department}'`,
        $select: 'id,displayName,mail,userPrincipalName,jobTitle',
      },
    },
  );

  return response.data.value ?? [];
}