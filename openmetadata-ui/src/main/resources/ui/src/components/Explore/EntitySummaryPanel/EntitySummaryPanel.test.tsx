/*
 *  Copyright 2023 Collate.
 *  Licensed under the Apache License, Version 2.0 (the "License");
 *  you may not use this file except in compliance with the License.
 *  You may obtain a copy of the License at
 *  http://www.apache.org/licenses/LICENSE-2.0
 *  Unless required by applicable law or agreed to in writing, software
 *  distributed under the License is distributed on an "AS IS" BASIS,
 *  WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 *  See the License for the specific language governing permissions and
 *  limitations under the License.
 */

import { render, screen } from '@testing-library/react';
import { EntityType } from 'enums/entity.enum';
import React from 'react';
import EntitySummaryPanel from './EntitySummaryPanel.component';
import { mockDashboardEntityDetails } from './mocks/DashboardSummary.mock';
import { mockMlModelEntityDetails } from './mocks/MlModelSummary.mock';
import { mockPipelineEntityDetails } from './mocks/PipelineSummary.mock';
import { mockTableEntityDetails } from './mocks/TableSummary.mock';
import { mockTopicEntityDetails } from './mocks/TopicSummary.mock';

const mockHandleClosePanel = jest.fn();

jest.mock('./TableSummary/TableSummary.component', () =>
  jest
    .fn()
    .mockImplementation(() => (
      <div data-testid="TableSummary">TableSummary</div>
    ))
);

jest.mock('./TopicSummary/TopicSummary.component', () =>
  jest
    .fn()
    .mockImplementation(() => (
      <div data-testid="TopicSummary">TopicSummary</div>
    ))
);

jest.mock('./DashboardSummary/DashboardSummary.component', () =>
  jest
    .fn()
    .mockImplementation(() => (
      <div data-testid="DashboardSummary">DashboardSummary</div>
    ))
);

jest.mock('utils/EntityUtils', () => ({
  getEntityLinkFromType: jest.fn().mockImplementation(() => 'link'),
  getEntityName: jest.fn().mockImplementation(() => 'displayName'),
}));
jest.mock('utils/StringsUtils', () => ({
  getEncodedFqn: jest.fn().mockImplementation((fqn) => fqn),
  stringToHTML: jest.fn(),
}));

jest.mock('./PipelineSummary/PipelineSummary.component', () =>
  jest
    .fn()
    .mockImplementation(() => (
      <div data-testid="PipelineSummary">PipelineSummary</div>
    ))
);

jest.mock('./MlModelSummary/MlModelSummary.component', () =>
  jest
    .fn()
    .mockImplementation(() => (
      <div data-testid="MlModelSummary">MlModelSummary</div>
    ))
);

jest.mock('react-router-dom', () => ({
  useParams: jest.fn().mockImplementation(() => ({ tab: 'table' })),
  Link: jest.fn().mockImplementation(({ children }) => <>{children}</>),
}));

describe('EntitySummaryPanel component tests', () => {
  it('TableSummary should render for table data', async () => {
    render(
      <EntitySummaryPanel
        entityDetails={{
          details: { ...mockTableEntityDetails, entityType: EntityType.TABLE },
        }}
        handleClosePanel={mockHandleClosePanel}
      />
    );

    const tableSummary = screen.getByTestId('TableSummary');

    expect(tableSummary).toBeInTheDocument();
  });

  it('TopicSummary should render for topics data', async () => {
    render(
      <EntitySummaryPanel
        entityDetails={{
          details: { ...mockTopicEntityDetails, entityType: EntityType.TOPIC },
        }}
        handleClosePanel={mockHandleClosePanel}
      />
    );

    const topicSummary = screen.getByTestId('TopicSummary');

    expect(topicSummary).toBeInTheDocument();
  });

  it('DashboardSummary should render for dashboard data', async () => {
    render(
      <EntitySummaryPanel
        entityDetails={{
          details: {
            ...mockDashboardEntityDetails,
            entityType: EntityType.DASHBOARD,
          },
        }}
        handleClosePanel={mockHandleClosePanel}
      />
    );

    const dashboardSummary = screen.getByTestId('DashboardSummary');

    expect(dashboardSummary).toBeInTheDocument();
  });

  it('PipelineSummary should render for pipeline data', async () => {
    render(
      <EntitySummaryPanel
        entityDetails={{
          details: {
            ...mockPipelineEntityDetails,
            entityType: EntityType.PIPELINE,
          },
        }}
        handleClosePanel={mockHandleClosePanel}
      />
    );

    const pipelineSummary = screen.getByTestId('PipelineSummary');

    expect(pipelineSummary).toBeInTheDocument();
  });

  it('MlModelSummary should render for mlModel data', async () => {
    render(
      <EntitySummaryPanel
        entityDetails={{
          details: {
            ...mockMlModelEntityDetails,
            entityType: EntityType.MLMODEL,
          },
        }}
        handleClosePanel={mockHandleClosePanel}
      />
    );

    const mlModelSummary = screen.getByTestId('MlModelSummary');

    expect(mlModelSummary).toBeInTheDocument();
  });
});
