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

import { Button, Form, FormProps, Input, Select, Space } from 'antd';
import { AxiosError } from 'axios';
import { CreateTestCase } from 'generated/api/tests/createTestCase';
import { t } from 'i18next';
import { isEmpty } from 'lodash';
import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useParams } from 'react-router-dom';
import { getListTestCase, getListTestDefinitions } from 'rest/testAPI';
import { getEntityName } from 'utils/EntityUtils';
import {
  API_RES_MAX_SIZE,
  PAGE_SIZE_LARGE,
} from '../../../constants/constants';
import { ProfilerDashboardType } from '../../../enums/table.enum';
import {
  TestCase,
  TestCaseParameterValue,
} from '../../../generated/tests/testCase';
import {
  EntityType,
  TestDataType,
  TestDefinition,
  TestPlatform,
} from '../../../generated/tests/testDefinition';
import { replaceAllSpacialCharWith_ } from '../../../utils/CommonUtils';
import { getDecodedFqn } from '../../../utils/StringsUtils';
import { generateEntityLink } from '../../../utils/TableUtils';
import { showErrorToast } from '../../../utils/ToastUtils';
import RichTextEditor from '../../common/rich-text-editor/RichTextEditor';
import { EditorContentRef } from '../../common/rich-text-editor/RichTextEditor.interface';
import { TestCaseFormProps } from '../AddDataQualityTest.interface';
import ParameterForm from './ParameterForm';

const TestCaseForm: React.FC<TestCaseFormProps> = ({
  initialValue,
  onSubmit,
  onCancel,
  table,
}) => {
  const { entityTypeFQN, dashboardType } = useParams<Record<string, string>>();
  const decodedEntityFQN = getDecodedFqn(entityTypeFQN);
  const isColumnFqn = dashboardType === ProfilerDashboardType.COLUMN;
  const [form] = Form.useForm();
  const markdownRef = useRef<EditorContentRef>();
  const [testDefinitions, setTestDefinitions] = useState<TestDefinition[]>([]);
  const [selectedTestType, setSelectedTestType] = useState<string | undefined>(
    initialValue?.testDefinition
  );
  const [testCases, setTestCases] = useState<TestCase[]>([]);

  const fetchAllTestDefinitions = async () => {
    try {
      const { data } = await getListTestDefinitions({
        limit: API_RES_MAX_SIZE,
        entityType: isColumnFqn ? EntityType.Column : EntityType.Table,
        testPlatform: TestPlatform.OpenMetadata,
        supportedDataType: isColumnFqn
          ? table.columns.find(
              (column) => column.fullyQualifiedName === decodedEntityFQN
            )?.dataType
          : undefined,
      });

      setTestDefinitions(data);
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };
  const fetchAllTestCases = async () => {
    try {
      const { data } = await getListTestCase({
        fields: 'testDefinition',
        limit: PAGE_SIZE_LARGE,
        entityLink: generateEntityLink(decodedEntityFQN, isColumnFqn),
      });

      setTestCases(data);
    } catch (error) {
      showErrorToast(error as AxiosError);
    }
  };

  const getSelectedTestDefinition = () => {
    const testType = isEmpty(initialValue?.testSuite)
      ? selectedTestType
      : initialValue?.testSuite;

    return testDefinitions.find(
      (definition) => definition.fullyQualifiedName === testType
    );
  };

  const GenerateParamsField = useCallback(() => {
    const selectedDefinition = getSelectedTestDefinition();
    if (selectedDefinition && selectedDefinition.parameterDefinition) {
      return <ParameterForm definition={selectedDefinition} table={table} />;
    }

    return;
  }, [selectedTestType, initialValue, testDefinitions]);

  const createTestCaseObj = (value: {
    testName: string;
    params: Record<string, string | { [key: string]: string }[]>;
    testTypeId: string;
  }): CreateTestCase => {
    const selectedDefinition = getSelectedTestDefinition();
    const paramsValue = selectedDefinition?.parameterDefinition?.[0];

    const parameterValues = Object.entries(value.params || {}).map(
      ([key, value]) => ({
        name: key,
        value:
          paramsValue?.dataType === TestDataType.Array
            ? // need to send array as string formate
              JSON.stringify(
                (value as { value: string }[]).map((data) => data.value)
              )
            : value,
      })
    );

    return {
      name: value.testName,
      entityLink: generateEntityLink(decodedEntityFQN, isColumnFqn),
      parameterValues: parameterValues as TestCaseParameterValue[],
      testDefinition: value.testTypeId,
      description: markdownRef.current?.getEditorContent(),
      testSuite: '',
    };
  };

  const handleFormSubmit: FormProps['onFinish'] = (value) => {
    onSubmit(createTestCaseObj(value));
  };

  const onBack = () => {
    const data = form.getFieldsValue();
    onCancel(createTestCaseObj(data));
  };

  const getParamsValue = () => {
    return initialValue?.parameterValues?.reduce(
      (acc, curr) => ({
        ...acc,
        [curr.name || '']:
          getSelectedTestDefinition()?.parameterDefinition?.[0].dataType ===
          TestDataType.Array
            ? (JSON.parse(curr?.value || '[]') as string[]).map((val) => ({
                value: val,
              }))
            : curr?.value,
      }),
      {}
    );
  };

  const handleValueChange: FormProps['onValuesChange'] = (value) => {
    if (value.testTypeId) {
      // const testType = testDefinitions.find(
      //   (test) => test.fullyQualifiedName === value.testTypeId
      // );
      setSelectedTestType(value.testTypeId);
      // const testCount = testCases.filter((test) =>
      //   test.name.includes(
      //     `${getNameFromFQN(decodedEntityFQN)}_${testType?.name}`
      //   )
      // );
      // generating dynamic unique name based on entity_testCase_number
      // const name = `${getNameFromFQN(decodedEntityFQN)}_${testType?.name}${
      //   testCount.length ? `_${testCount.length}` : ''
      // }`;
      // form.setFieldsValue({
      //   testName: replaceAllSpacialCharWith_(name),
      // });
    }
  };

  useEffect(() => {
    if (testDefinitions.length === 0) {
      fetchAllTestDefinitions();
    }
    if (isEmpty(testCases)) {
      fetchAllTestCases();
    }
    form.setFieldsValue({
      testName: replaceAllSpacialCharWith_(initialValue?.name ?? ''),
      testTypeId: initialValue?.testDefinition,
      params: initialValue?.parameterValues?.length
        ? getParamsValue()
        : undefined,
    });
  }, []);

  return (
    <Form
      form={form}
      layout="vertical"
      name="tableTestForm"
      preserve={false}
      onFinish={handleFormSubmit}
      onValuesChange={handleValueChange}>
      {isColumnFqn && (
        <Form.Item
          label={t('label.column')}
          name="column"
          rules={[
            {
              required: true,
              message: `${t('label.field-required', {
                field: t('label.column'),
              })}`,
            },
          ]}>
          <Select
            placeholder={t('label.please-select-entity', {
              entity: t('label.column-lowercase'),
            })}>
            {table.columns.map((column) => (
              <Select.Option key={column.name}>{column.name}</Select.Option>
            ))}
          </Select>
        </Form.Item>
      )}
      <Form.Item
        label={t('label.name')}
        name="testName"
        rules={[
          {
            required: true,
            message: `${t('label.field-required', { field: t('label.name') })}`,
          },
          {
            pattern: /^[A-Za-z0-9_]*$/g,
            message: t('message.special-character-not-allowed'),
          },
          {
            validator: (_, value) => {
              if (testCases.some((test) => test.name === value)) {
                return Promise.reject(
                  t('message.entity-already-exists', {
                    entity: t('label.name'),
                  })
                );
              }

              return Promise.resolve();
            },
          },
        ]}>
        <Input placeholder={t('message.enter-test-case-name')} />
      </Form.Item>
      <Form.Item
        label={t('label.test-type')}
        name="testTypeId"
        rules={[
          {
            required: true,
            message: `${t('label.field-required', {
              field: t('label.test-type'),
            })}`,
          },
        ]}>
        <Select
          options={testDefinitions.map((suite) => ({
            label: getEntityName(suite),
            value: suite.fullyQualifiedName,
          }))}
          placeholder={t('label.select-field', { field: t('label.test-type') })}
        />
      </Form.Item>

      {GenerateParamsField()}

      <Form.Item label={t('label.description')} name="description">
        <RichTextEditor
          initialValue={initialValue?.description || ''}
          ref={markdownRef}
          style={{
            margin: 0,
          }}
        />
      </Form.Item>

      <Form.Item noStyle>
        <Space className="tw-w-full tw-justify-end" size={16}>
          <Button onClick={onBack}>{t('label.back')}</Button>
          <Button data-testid="submit-test" htmlType="submit" type="primary">
            {t('label.submit')}
          </Button>
        </Space>
      </Form.Item>
    </Form>
  );
};

export default TestCaseForm;
