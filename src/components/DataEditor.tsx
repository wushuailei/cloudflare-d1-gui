import { useState } from 'react';
import { Modal, Form, Input, InputNumber, Switch, message } from 'antd';
import type { ColumnInfo } from '../types';

interface DataEditorProps {
  visible: boolean;
  mode: 'add' | 'edit';
  tableName: string;
  columns: ColumnInfo[];
  initialValues?: Record<string, unknown>;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  onCancel: () => void;
}

export default function DataEditor({
  visible,
  mode,
  tableName,
  columns,
  initialValues,
  onSave,
  onCancel,
}: DataEditorProps) {
  const [form] = Form.useForm();
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      const values = await form.validateFields();
      setSaving(true);
      await onSave(values);
      form.resetFields();
      message.success(mode === 'add' ? '数据已添加' : '数据已更新');
    } catch (error) {
      console.error('Save failed:', error);
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    form.resetFields();
    onCancel();
  };

  // Generate form field based on column type
  const renderFormField = (column: ColumnInfo) => {
    const { name, type, notnull, pk } = column;
    const isRequired = notnull === 1 && pk !== 1; // PK usually auto-increment
    const isPrimaryKey = pk === 1;

    // Skip auto-increment primary keys in add mode
    if (mode === 'add' && isPrimaryKey) {
      return null;
    }

    const upperType = type.toUpperCase();

    // Integer types
    if (upperType.includes('INT')) {
      return (
        <Form.Item
          key={name}
          label={name}
          name={name}
          rules={[{ required: isRequired, message: `请输入${name}` }]}
          initialValue={initialValues?.[name]}
        >
          <InputNumber
            style={{ width: '100%' }}
            placeholder={`请输入${name}`}
            disabled={mode === 'edit' && isPrimaryKey}
          />
        </Form.Item>
      );
    }

    // Real/Float types
    if (upperType.includes('REAL') || upperType.includes('FLOAT') || upperType.includes('DOUBLE')) {
      return (
        <Form.Item
          key={name}
          label={name}
          name={name}
          rules={[{ required: isRequired, message: `请输入${name}` }]}
          initialValue={initialValues?.[name]}
        >
          <InputNumber
            style={{ width: '100%' }}
            step={0.01}
            placeholder={`请输入${name}`}
          />
        </Form.Item>
      );
    }

    // Boolean types
    if (upperType.includes('BOOL')) {
      return (
        <Form.Item
          key={name}
          label={name}
          name={name}
          valuePropName="checked"
          initialValue={initialValues?.[name] === 1 || initialValues?.[name] === true}
        >
          <Switch />
        </Form.Item>
      );
    }

    // Text/Blob types
    if (upperType.includes('TEXT') || upperType.includes('BLOB') || upperType.includes('CLOB')) {
      return (
        <Form.Item
          key={name}
          label={name}
          name={name}
          rules={[{ required: isRequired, message: `请输入${name}` }]}
          initialValue={initialValues?.[name]}
        >
          <Input.TextArea
            rows={3}
            placeholder={`请输入${name}`}
          />
        </Form.Item>
      );
    }

    // Default: VARCHAR/CHAR/etc
    return (
      <Form.Item
        key={name}
        label={name}
        name={name}
        rules={[{ required: isRequired, message: `请输入${name}` }]}
        initialValue={initialValues?.[name]}
      >
        <Input
          placeholder={`请输入${name}`}
          disabled={mode === 'edit' && isPrimaryKey}
        />
      </Form.Item>
    );
  };

  return (
    <Modal
      title={mode === 'add' ? `添加数据 - ${tableName}` : `编辑数据 - ${tableName}`}
      open={visible}
      onOk={handleSave}
      onCancel={handleCancel}
      confirmLoading={saving}
      width={600}
      okText="保存"
      cancelText="取消"
    >
      <Form
        form={form}
        layout="vertical"
        initialValues={initialValues}
      >
        {columns.map(renderFormField)}
      </Form>
    </Modal>
  );
}
