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
import Icon, { DownOutlined } from '@ant-design/icons';
import { Button, Col, Dropdown, Row, Space, Tooltip, Typography } from 'antd';
import { ItemType } from 'antd/lib/menu/hooks/useItems';
import { ReactComponent as EditIcon } from 'assets/svg/edit-new.svg';
import { ReactComponent as IconFolder } from 'assets/svg/folder.svg';
import { ReactComponent as ExportIcon } from 'assets/svg/ic-export.svg';
import { ReactComponent as IconFlatDoc } from 'assets/svg/ic-flat-doc.svg';
import { ReactComponent as ImportIcon } from 'assets/svg/ic-import.svg';
import { ReactComponent as VersionIcon } from 'assets/svg/ic-version.svg';
import { ReactComponent as IconDropdown } from 'assets/svg/menu.svg';
import classNames from 'classnames';
import { ManageButtonItemLabel } from 'components/common/ManageButtonContentItem/ManageButtonContentItem.component';
import { TitleBreadcrumbProps } from 'components/common/title-breadcrumb/title-breadcrumb.interface';
import { useEntityExportModalProvider } from 'components/Entity/EntityExportModalProvider/EntityExportModalProvider.component';
import { EntityHeader } from 'components/Entity/EntityHeader/EntityHeader.component';
import EntityDeleteModal from 'components/Modals/EntityDeleteModal/EntityDeleteModal';
import EntityNameModal from 'components/Modals/EntityNameModal/EntityNameModal.component';
import { OperationPermission } from 'components/PermissionProvider/PermissionProvider.interface';
import { FQN_SEPARATOR_CHAR } from 'constants/char.constants';
import { DE_ACTIVE_COLOR } from 'constants/constants';
import { EntityAction, EntityType } from 'enums/entity.enum';
import { Glossary } from 'generated/entity/data/glossary';
import {
  EntityReference,
  GlossaryTerm,
} from 'generated/entity/data/glossaryTerm';
import { cloneDeep, toString } from 'lodash';
import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { useTranslation } from 'react-i18next';
import { useHistory, useParams } from 'react-router-dom';
import { exportGlossaryInCSVFormat } from 'rest/glossaryAPI';
import { getEntityDeleteMessage } from 'utils/CommonUtils';
import {
  getGlossaryPath,
  getGlossaryPathWithAction,
  getGlossaryTermsVersionsPath,
  getGlossaryVersionsPath,
} from 'utils/RouterUtils';
import SVGIcons, { Icons } from 'utils/SvgUtils';

export interface GlossaryHeaderProps {
  supportAddOwner?: boolean;
  selectedData: Glossary | GlossaryTerm;
  permissions: OperationPermission;
  isGlossary: boolean;
  onUpdate: (data: GlossaryTerm | Glossary) => void;
  onDelete: (id: string) => void;
  onAssetAdd?: () => void;
  onAddGlossaryTerm: (glossaryTerm: GlossaryTerm | undefined) => void;
}

const GlossaryHeader = ({
  selectedData,
  permissions,
  onUpdate,
  onDelete,
  isGlossary,
  onAssetAdd,
  onAddGlossaryTerm,
}: GlossaryHeaderProps) => {
  const { t } = useTranslation();
  const history = useHistory();
  const { glossaryName: glossaryFqn, version } = useParams<{
    glossaryName: string;
    version: string;
  }>();
  const { showModal } = useEntityExportModalProvider();
  const [breadcrumb, setBreadcrumb] = useState<
    TitleBreadcrumbProps['titleLinks']
  >([]);
  const [showActions, setShowActions] = useState(false);
  const [isDelete, setIsDelete] = useState<boolean>(false);
  const [isNameEditing, setIsNameEditing] = useState<boolean>(false);

  const editDisplayNamePermission = useMemo(() => {
    return permissions.EditAll || permissions.EditDisplayName;
  }, [permissions]);

  const handleAddGlossaryTermClick = useCallback(() => {
    onAddGlossaryTerm(!isGlossary ? (selectedData as GlossaryTerm) : undefined);
  }, [glossaryFqn]);

  const handleGlossaryImport = () =>
    history.push(
      getGlossaryPathWithAction(selectedData.name, EntityAction.IMPORT)
    );

  const handleVersionClick = async () => {
    const path = isGlossary
      ? getGlossaryVersionsPath(selectedData.id, toString(selectedData.version))
      : getGlossaryTermsVersionsPath(
          selectedData.id,
          toString(selectedData.version)
        );

    history.push(path);
  };

  const handleDelete = () => {
    const { id } = selectedData;
    onDelete(id);
    setIsDelete(false);
  };

  const onNameSave = (obj: { name: string; displayName: string }) => {
    const { name, displayName } = obj;
    let updatedDetails = cloneDeep(selectedData);

    updatedDetails = {
      ...selectedData,
      name: name?.trim() || selectedData.name,
      displayName: displayName?.trim(),
    };

    onUpdate(updatedDetails);
    setIsNameEditing(false);
  };

  const addButtonContent = [
    {
      label: t('label.glossary-term'),
      key: '1',
      onClick: handleAddGlossaryTermClick,
    },
    {
      label: t('label.asset-plural'),
      key: '2',
      onClick: onAssetAdd,
    },
  ];

  const handleGlossaryExportClick = useCallback(async () => {
    if (selectedData) {
      showModal({
        name: selectedData?.name,
        onExport: exportGlossaryInCSVFormat,
      });
    }
  }, [selectedData]);

  const manageButtonContent: ItemType[] = [
    ...(isGlossary
      ? ([
          {
            label: (
              <ManageButtonItemLabel
                description={t('message.export-entity-help', {
                  entity: t('label.glossary-term-lowercase-plural'),
                })}
                icon={<ExportIcon width="18px" />}
                id="export-button"
                name={t('label.export')}
              />
            ),
            key: 'export-button',
            onClick: (e) => {
              e.domEvent.stopPropagation();
              handleGlossaryExportClick();
              setShowActions(false);
            },
          },
          {
            label: (
              <ManageButtonItemLabel
                description={t('message.import-entity-help', {
                  entity: t('label.glossary-term-lowercase'),
                })}
                icon={<ImportIcon width="20px" />}
                id="import-button"
                name={t('label.import')}
              />
            ),
            key: 'import-button',
            onClick: (e) => {
              e.domEvent.stopPropagation();
              handleGlossaryImport();
              setShowActions(false);
            },
          },
        ] as ItemType[])
      : []),
    ...(editDisplayNamePermission
      ? ([
          {
            label: (
              <ManageButtonItemLabel
                description={t('message.rename-entity', {
                  entity: isGlossary
                    ? t('label.glossary')
                    : t('label.glossary-term'),
                })}
                icon={<EditIcon color={DE_ACTIVE_COLOR} width="18px" />}
                id="rename-button"
                name={t('label.rename')}
              />
            ),
            key: 'rename-button',
            onClick: (e) => {
              e.domEvent.stopPropagation();
              setIsNameEditing(true);
              setShowActions(false);
            },
          },
        ] as ItemType[])
      : []),
    ...(permissions.Delete
      ? ([
          {
            label: (
              <ManageButtonItemLabel
                description={t(
                  'message.delete-entity-type-action-description',
                  {
                    entityType: isGlossary
                      ? t('label.glossary')
                      : t('label.glossary-term'),
                  }
                )}
                icon={<SVGIcons alt="Delete" icon={Icons.DELETE} />}
                id="delete-button"
                name={t('label.delete')}
              />
            ),
            key: 'delete-button',
            onClick: (e) => {
              e.domEvent.stopPropagation();
              setIsDelete(true);
              setShowActions(false);
            },
          },
        ] as ItemType[])
      : []),
  ];

  const createButtons = useMemo(() => {
    if (permissions.Create) {
      return isGlossary ? (
        <Button
          className="m-l-xs"
          data-testid="add-new-tag-button-header"
          size="middle"
          type="primary"
          onClick={handleAddGlossaryTermClick}>
          {t('label.add-entity', { entity: t('label.term-lowercase') })}
        </Button>
      ) : (
        <Dropdown
          className="m-l-xs"
          menu={{
            items: addButtonContent,
          }}
          placement="bottomRight"
          trigger={['click']}>
          <Button type="primary">
            <Space>
              {t('label.add')}
              <DownOutlined />
            </Space>
          </Button>
        </Dropdown>
      );
    }

    return null;
  }, [isGlossary, permissions, addButtonContent]);

  /**
   * To create breadcrumb from the fqn
   * @param fqn fqn of glossary or glossary term
   */
  const handleBreadcrumb = (fqn: string) => {
    if (!fqn) {
      return;
    }

    const arr = fqn.split(FQN_SEPARATOR_CHAR);
    const dataFQN: Array<string> = [];
    const newData = [
      {
        name: 'Glossaries',
        url: getGlossaryPath(arr[0]),
        activeTitle: false,
      },
      ...arr.slice(0, -1).map((d) => {
        dataFQN.push(d);

        return {
          name: d,
          url: getGlossaryPath(dataFQN.join(FQN_SEPARATOR_CHAR)),
          activeTitle: false,
        };
      }),
    ];

    setBreadcrumb(newData);
  };

  useEffect(() => {
    const { fullyQualifiedName, name } = selectedData;
    handleBreadcrumb(fullyQualifiedName ? fullyQualifiedName : name);
  }, [selectedData]);

  return (
    <>
      <Row gutter={[0, 16]} justify="space-between" wrap={false}>
        <Col flex="auto">
          <EntityHeader
            breadcrumb={breadcrumb}
            entityData={selectedData}
            entityType={EntityType.GLOSSARY_TERM}
            icon={
              isGlossary ? (
                <IconFolder
                  color={DE_ACTIVE_COLOR}
                  height={36}
                  name="folder"
                  width={32}
                />
              ) : (
                <IconFlatDoc
                  color={DE_ACTIVE_COLOR}
                  height={36}
                  name="doc"
                  width={32}
                />
              )
            }
            serviceName=""
          />
        </Col>
        <Col flex="280px">
          <div style={{ textAlign: 'right' }}>
            <div>
              {createButtons}
              {selectedData && selectedData.version && (
                <Button
                  className={classNames('m-l-xs', {
                    'text-primary border-primary': version,
                  })}
                  icon={<Icon component={VersionIcon} />}
                  onClick={handleVersionClick}>
                  <Typography.Text
                    className={classNames('m-l-xs', {
                      'text-primary': version,
                    })}>
                    {toString(selectedData.version)}
                  </Typography.Text>
                </Button>
              )}

              <Dropdown
                align={{ targetOffset: [-12, 0] }}
                className="m-l-xs"
                menu={{
                  items: manageButtonContent,
                }}
                open={showActions}
                overlayClassName="glossary-manage-dropdown-list-container"
                overlayStyle={{ width: '350px' }}
                placement="bottomRight"
                trigger={['click']}
                onOpenChange={setShowActions}>
                <Tooltip placement="right">
                  <Button
                    className="glossary-manage-dropdown-button tw-px-1.5"
                    data-testid="manage-button"
                    onClick={() => setShowActions(true)}>
                    <IconDropdown className="anticon self-center manage-dropdown-icon" />
                  </Button>
                </Tooltip>
              </Dropdown>
            </div>
          </div>
        </Col>
      </Row>
      {selectedData && (
        <EntityDeleteModal
          bodyText={getEntityDeleteMessage(selectedData.name, '')}
          entityName={selectedData.name}
          entityType="Glossary"
          loadingState="success"
          visible={isDelete}
          onCancel={() => setIsDelete(false)}
          onConfirm={handleDelete}
        />
      )}

      <EntityNameModal
        allowRename
        entity={selectedData as EntityReference}
        title={t('label.edit-entity', {
          entity: t('label.name'),
        })}
        visible={isNameEditing}
        onCancel={() => setIsNameEditing(false)}
        onSave={onNameSave}
      />
    </>
  );
};

export default GlossaryHeader;
