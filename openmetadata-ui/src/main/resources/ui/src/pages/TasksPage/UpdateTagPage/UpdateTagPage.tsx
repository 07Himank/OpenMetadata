/*
 *  Copyright 2022 Collate.
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

import { Button, Card, Form, FormProps, Input, Space } from 'antd';
import { useForm } from 'antd/lib/form/Form';
import { AxiosError } from 'axios';
import { ActivityFeedTabs } from 'components/ActivityFeed/ActivityFeedTab/ActivityFeedTab.interface';
import ProfilePicture from 'components/common/ProfilePicture/ProfilePicture';
import TitleBreadcrumb from 'components/common/title-breadcrumb/title-breadcrumb.component';
import PageLayoutV1 from 'components/containers/PageLayoutV1';
import { capitalize, isEmpty, isNil, isUndefined } from 'lodash';
import { observer } from 'mobx-react';
import { EntityTags } from 'Models';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useLocation, useParams } from 'react-router-dom';
import { postThread } from 'rest/feedsAPI';
import { getEntityDetailLink } from 'utils/CommonUtils';
import AppState from '../../../AppState';
import { FQN_SEPARATOR_CHAR } from '../../../constants/char.constants';
import { EntityField } from '../../../constants/Feeds.constants';
import { EntityTabs, EntityType } from '../../../enums/entity.enum';
import {
  CreateThread,
  TaskType,
} from '../../../generated/api/feed/createThread';
import { Table } from '../../../generated/entity/data/table';
import { ThreadType } from '../../../generated/entity/feed/thread';
import { TagLabel } from '../../../generated/type/tagLabel';
import {
  ENTITY_LINK_SEPARATOR,
  getEntityFeedLink,
  getEntityName,
} from '../../../utils/EntityUtils';
import { getTagsWithoutTier, getTierTags } from '../../../utils/TableUtils';
import {
  fetchEntityDetail,
  fetchOptions,
  getBreadCrumbList,
  getColumnObject,
} from '../../../utils/TasksUtils';
import { showErrorToast, showSuccessToast } from '../../../utils/ToastUtils';
import Assignees from '../shared/Assignees';
import { TagsTabs } from '../shared/TagsTabs';
import '../TaskPage.style.less';
import { EntityData, Option } from '../TasksPage.interface';

const UpdateTag = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const history = useHistory();
  const [form] = useForm();

  const { entityType, entityFQN } = useParams<{ [key: string]: string }>();
  const queryParams = new URLSearchParams(location.search);

  const field = queryParams.get('field');
  const value = queryParams.get('value');

  const [entityData, setEntityData] = useState<EntityData>({} as EntityData);
  const [options, setOptions] = useState<Option[]>([]);
  const [assignees, setAssignees] = useState<Option[]>([]);
  const [currentTags, setCurrentTags] = useState<TagLabel[]>([]);
  const [suggestion, setSuggestion] = useState<TagLabel[]>([]);

  const entityTier = useMemo(() => {
    const tierFQN = getTierTags(entityData.tags || [])?.tagFQN;

    return tierFQN?.split(FQN_SEPARATOR_CHAR)[1];
  }, [entityData.tags]);

  const entityTags = useMemo(() => {
    const tags: EntityTags[] = getTagsWithoutTier(entityData.tags || []) || [];

    return tags.map((tag) => `#${tag.tagFQN}`).join(' ');
  }, [entityData.tags]);

  const getSanitizeValue = value?.replaceAll(/^"|"$/g, '') || '';

  const message = `Update tags for ${getSanitizeValue || entityType} ${
    field !== EntityField.COLUMNS ? getEntityName(entityData) : ''
  }`;

  // get current user details
  const currentUser = useMemo(
    () => AppState.getCurrentUserDetails(),
    [AppState.userDetails, AppState.nonSecureUserDetails]
  );

  const back = () => history.goBack();

  const columnObject = useMemo(() => {
    const column = getSanitizeValue.split(FQN_SEPARATOR_CHAR).slice(-1);

    return getColumnObject(column[0], (entityData as Table).columns || []);
  }, [field, entityData]);

  const getColumnDetails = useCallback(() => {
    if (!isNil(field) && !isNil(value) && field === EntityField.COLUMNS) {
      return (
        <div data-testid="column-details">
          <p className="tw-font-semibold">
            {t('label.column-entity', { entity: t('label.detail-plural') })}
          </p>
          <p>
            <span className="text-grey-muted">{`${t('label.type')}:`}</span>{' '}
            <span>{columnObject.dataTypeDisplay}</span>
          </p>
          <p>
            {columnObject?.tags
              ?.map((tag: TagLabel) => `#${tag.tagFQN}`)
              ?.join(' ')}
          </p>
        </div>
      );
    } else {
      return null;
    }
  }, [(entityData as Table).columns]);

  const getTags = () => {
    if (!isEmpty(columnObject) && !isUndefined(columnObject)) {
      return columnObject.tags ?? [];
    } else {
      return entityData.tags ?? [];
    }
  };

  const onSearch = (query: string) => {
    fetchOptions(query, setOptions);
  };

  const getTaskAbout = () => {
    if (field && value) {
      return `${field}${ENTITY_LINK_SEPARATOR}${value}${ENTITY_LINK_SEPARATOR}tags`;
    } else {
      return EntityField.TAGS;
    }
  };

  const onCreateTask: FormProps['onFinish'] = (value) => {
    const data: CreateThread = {
      from: currentUser?.name as string,
      message: value.title || message,
      about: getEntityFeedLink(entityType, entityFQN, getTaskAbout()),
      taskDetails: {
        assignees: assignees.map((assignee) => ({
          id: assignee.value,
          type: assignee.type,
        })),
        suggestion: JSON.stringify(suggestion),
        type: TaskType.UpdateTag,
        oldValue: JSON.stringify(currentTags),
      },
      type: ThreadType.Task,
    };
    postThread(data)
      .then(() => {
        showSuccessToast(
          t('server.create-entity-success', {
            entity: t('label.task'),
          })
        );
        history.push(
          getEntityDetailLink(
            entityType as EntityType,
            entityFQN,
            EntityTabs.ACTIVITY_FEED,
            ActivityFeedTabs.TASKS
          )
        );
      })
      .catch((err: AxiosError) => showErrorToast(err));
  };

  useEffect(() => {
    fetchEntityDetail(
      entityType as EntityType,
      entityFQN as string,
      setEntityData
    );
  }, [entityFQN, entityType]);

  useEffect(() => {
    const owner = entityData.owner;
    let defaultAssignee: Option[] = [];
    if (owner) {
      defaultAssignee = [
        {
          label: getEntityName(owner),
          value: owner.id || '',
          type: owner.type,
        },
      ];
      setAssignees(defaultAssignee);
      setOptions(defaultAssignee);
    }
    form.setFieldsValue({
      title: message.trimEnd(),
      updateTags: getTags(),
      assignees: defaultAssignee,
    });
  }, [entityData]);

  useEffect(() => {
    setCurrentTags(getTags());
    setSuggestion(getTags());
  }, [entityData, columnObject]);

  return (
    <PageLayoutV1 center pageTitle={t('label.task')}>
      <Space className="w-full" direction="vertical" size="middle">
        <TitleBreadcrumb
          titleLinks={[
            ...getBreadCrumbList(entityData, entityType as EntityType),
            {
              name: t('label.create-entity', {
                entity: t('label.task'),
              }),
              activeTitle: true,
              url: '',
            },
          ]}
        />
        <Card
          className="m-t-0 request-tags"
          key="update-tags"
          title={t('label.create-entity', {
            entity: t('label.task'),
          })}>
          <Form form={form} layout="vertical" onFinish={onCreateTask}>
            <Form.Item
              data-testid="title"
              label={`${t('label.title')}:`}
              name="title">
              <Input
                disabled
                placeholder={t('label.task-entity', {
                  entity: t('label.title'),
                })}
              />
            </Form.Item>
            <Form.Item
              className="m-y-0"
              data-testid="assignees"
              label={`${t('label.assignee-plural')}:`}
              name="assignees"
              rules={[
                {
                  required: true,
                  message: t('message.field-text-is-required', {
                    fieldText: t('label.assignee-plural'),
                  }),
                },
              ]}>
              <Assignees
                options={options}
                value={assignees}
                onChange={setAssignees}
                onSearch={onSearch}
              />
            </Form.Item>

            {currentTags.length ? (
              <Form.Item
                data-testid="tags-label"
                label={t('label.update-entity', {
                  entity: t('label.tag-plural'),
                })}
                name="updateTags"
                rules={[
                  {
                    required: true,
                    message: t('message.field-text-is-required', {
                      fieldText: t('label.tag-plural'),
                    }),
                  },
                ]}>
                <TagsTabs
                  tags={currentTags}
                  value={suggestion}
                  onChange={setSuggestion}
                />
              </Form.Item>
            ) : null}

            <Form.Item>
              <Space
                className="w-full justify-end"
                data-testid="cta-buttons"
                size={16}>
                <Button type="link" onClick={back}>
                  {t('label.back')}
                </Button>
                <Button
                  data-testid="submit-test"
                  htmlType="submit"
                  type="primary">
                  {t('label.submit')}
                </Button>
              </Space>
            </Form.Item>
          </Form>
        </Card>
      </Space>

      <div className="m-t-xlg p-x-lg w-500" data-testid="entity-details">
        <h6 className="tw-text-base">
          {capitalize(entityType)} {t('label.detail-plural')}
        </h6>
        <div className="d-flex tw-mb-4">
          <span className="text-grey-muted">{`${t('label.owner')}:`}</span>{' '}
          <span>
            {entityData.owner ? (
              <span className="d-flex tw-ml-1">
                <ProfilePicture
                  displayName={getEntityName(entityData.owner)}
                  id=""
                  name={getEntityName(entityData.owner)}
                  width="20"
                />
                <span className="tw-ml-1">
                  {getEntityName(entityData.owner)}
                </span>
              </span>
            ) : (
              <span className="text-grey-muted tw-ml-1">
                {t('label.no-entity', { entity: t('label.owner') })}
              </span>
            )}
          </span>
        </div>

        <p data-testid="tier">
          {entityTier ? (
            entityTier
          ) : (
            <span className="text-grey-muted">
              {t('label.no-entity', { entity: t('label.tier') })}
            </span>
          )}
        </p>

        <p data-testid="tags">{entityTags}</p>

        {getColumnDetails()}
      </div>
    </PageLayoutV1>
  );
};

export default observer(UpdateTag);
