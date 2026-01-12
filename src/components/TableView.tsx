import { useState, useEffect } from 'react';
import { Table, Card, Space, Button, message, Statistic, Row, Col, Popconfirm, Tabs } from 'antd';
import { ReloadOutlined, InfoCircleOutlined, PlusOutlined, EditOutlined, DeleteOutlined } from '@ant-design/icons';
import type { DatabaseConnection, TableSchema } from '../types';
import { apiService } from '../services/api';
import DataEditor from './DataEditor';

interface TableViewProps {
  tableName: string;
  connection?: DatabaseConnection;
}

export default function TableView({ tableName, connection }: TableViewProps) {
  const [loading, setLoading] = useState(false);
  const [schema, setSchema] = useState<TableSchema | null>(null);
  const [data, setData] = useState<Record<string, unknown>[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(50);
  const [editorVisible, setEditorVisible] = useState(false);
  const [editorMode, setEditorMode] = useState<'add' | 'edit'>('add');
  const [editingRecord, setEditingRecord] = useState<Record<string, unknown> | undefined>();

  useEffect(() => {
    if (tableName && connection) {
      loadSchema();
      loadData(1, pageSize);
    }
  }, [tableName, connection]); // eslint-disable-line react-hooks/exhaustive-deps

  const loadSchema = async () => {
    if (!connection) return;

    try {
      const result = await apiService.getTableSchema(tableName, connection);
      if (result.success && result.data) {
        setSchema(result.data);
      } else {
        message.error(result.error || '加载表结构失败');
      }
    } catch (error) {
      console.error('Failed to load schema:', error);
    }
  };

  const loadData = async (currentPage: number, currentPageSize: number) => {
    if (!connection) return;

    setLoading(true);
    try {
      // Get total count
      const countResult = await apiService.getTableCount(tableName, connection);
      if (countResult.success && countResult.data !== undefined) {
        setTotal(countResult.data);
      }

      // Get page data
      const result = await apiService.getTableData(
        tableName,
        currentPage,
        currentPageSize,
        connection
      );

      if (result.success && result.data) {
        const tableData = result.data.rows.map((row, index) => {
          const record: Record<string, unknown> = { key: index };
          result.data!.columns.forEach((col, colIndex) => {
            record[col] = row[colIndex];
          });
          return record;
        });
        setData(tableData);
      } else {
        message.error(result.error || '加载数据失败');
        setData([]);
      }
    } catch (error) {
      console.error('Failed to load data:', error);
      message.error('加载数据失败');
    } finally {
      setLoading(false);
    }
  };

  const handleRefresh = () => {
    loadData(page, pageSize);
  };

  const handlePageChange = (newPage: number, newPageSize: number) => {
    setPage(newPage);
    setPageSize(newPageSize);
    loadData(newPage, newPageSize);
  };

  const handleAdd = () => {
    setEditorMode('add');
    setEditingRecord(undefined);
    setEditorVisible(true);
  };

  const handleEdit = (record: Record<string, unknown>) => {
    setEditorMode('edit');
    setEditingRecord(record);
    setEditorVisible(true);
  };

  const handleDelete = async (record: Record<string, unknown>) => {
    if (!connection || !schema) return;

    // Find primary key
    const pkColumn = schema.columns.find(col => col.pk === 1);
    if (!pkColumn) {
      message.error('该表没有主键，无法删除');
      return;
    }

    const pkValue = record[pkColumn.name];
    const whereClause = `${pkColumn.name} = ${typeof pkValue === 'string' ? `'${pkValue}'` : pkValue}`;

    try {
      const result = await apiService.deleteData(tableName, whereClause, connection);
      if (result.success) {
        message.success('删除成功');
        handleRefresh();
      } else {
        message.error(result.error || '删除失败');
      }
    } catch (error) {
      console.error('Delete failed:', error);
      message.error('删除失败');
    }
  };

  const handleSave = async (values: Record<string, unknown>) => {
    if (!connection || !schema) return;

    try {
      if (editorMode === 'add') {
        const result = await apiService.insertData(tableName, values, connection);
        if (result.success) {
          setEditorVisible(false);
          handleRefresh();
        } else {
          throw new Error(result.error);
        }
      } else {
        // Find primary key for update
        const pkColumn = schema.columns.find(col => col.pk === 1);
        if (!pkColumn || !editingRecord) {
          throw new Error('无法确定主键');
        }

        const pkValue = editingRecord[pkColumn.name];
        const whereClause = `${pkColumn.name} = ${typeof pkValue === 'string' ? `'${pkValue}'` : pkValue}`;

        const result = await apiService.updateData(tableName, values, whereClause, connection);
        if (result.success) {
          setEditorVisible(false);
          handleRefresh();
        } else {
          throw new Error(result.error);
        }
      }
    } catch (error) {
      message.error((error as Error).message || '保存失败');
      throw error;
    }
  };

  // Generate table columns from schema
  const tableColumns = [
    {
      title: '操作',
      key: 'actions',
      fixed: 'end' as const,
      width: 150,
      render: (_: unknown, record: Record<string, unknown>) => (
        <Space size="small">
          <Button
            type="link"
            size="small"
            icon={<EditOutlined />}
            onClick={() => handleEdit(record)}
          >
            编辑
          </Button>
          <Popconfirm
            title="确定要删除这条记录吗？"
            onConfirm={() => handleDelete(record)}
            okText="确定"
            cancelText="取消"
          >
            <Button
              type="link"
              size="small"
              danger
              icon={<DeleteOutlined />}
            >
              删除
            </Button>
          </Popconfirm>
        </Space>
      ),
    },
    ...(schema?.columns.map((col) => ({
      title: (
        <Space>
          {col.name}
          <span style={{ color: '#999', fontSize: 12, fontWeight: 'normal' }}>
            {col.type}
          </span>
          {col.pk === 1 && (
            <span style={{ color: '#1890ff', fontSize: 12 }}>PK</span>
          )}
        </Space>
      ),
      dataIndex: col.name,
      key: col.name,
      minWidth: 150,
      ellipsis: true,
      render: (value: unknown) => {
        if (value === null) return <span style={{ color: '#999' }}>NULL</span>;
        if (typeof value === 'boolean') return value ? 'true' : 'false';
        return String(value);
      },
    })) || []),
  ];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column', padding: 16 }}>
      {/* Header */}
      <div style={{ marginBottom: 16 }}>
        <Card size="small">
          <Row gutter={16} align="middle">
            <Col flex="auto">
              <Space size="large">
                <Statistic
                  title="表名"
                  value={tableName}
                  prefix={<InfoCircleOutlined />}
                />
                <Statistic
                  title="总行数"
                  value={total}
                  suffix="行"
                />
                <Statistic
                  title="列数"
                  value={schema?.columns.length || 0}
                  suffix="列"
                />
              </Space>
            </Col>
            <Col>
              <Space>
                <Button
                  type="primary"
                  icon={<PlusOutlined />}
                  onClick={handleAdd}
                >
                  添加数据
                </Button>
                <Button
                  icon={<ReloadOutlined />}
                  onClick={handleRefresh}
                  loading={loading}
                >
                  刷新
                </Button>
              </Space>
            </Col>
          </Row>
        </Card>
      </div>

      {/* Tabs for Schema and Data */}
      <Tabs
        defaultActiveKey="data"
        style={{ flex: 1, display: 'flex', flexDirection: 'column' }}
        items={[
          {
            key: 'data',
            label: '表数据',
            children: (
              <div style={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <Table
                  columns={tableColumns}
                  dataSource={data}
                  loading={loading}
                  size="small"
                  bordered
                  scroll={{ x: 'max-content' }}
                  pagination={{
                    current: page,
                    pageSize: pageSize,
                    total: total,
                    showSizeChanger: true,
                    showQuickJumper: true,
                    showTotal: (total) => `共 ${total} 条记录`,
                    onChange: handlePageChange,
                    pageSizeOptions: ['10', '20', '50', '100', '200'],
                  }}
                />
              </div>
            ),
          },
          {
            key: 'schema',
            label: '表结构',
            children: schema ? (
              <div style={{ height: 'calc(100vh - 250px)', overflow: 'auto' }}>
                <Table
                  size="small"
                  pagination={false}
                  bordered
                  columns={[
                    { title: '列名', dataIndex: 'name', key: 'name' },
                    { title: '类型', dataIndex: 'type', key: 'type' },
                    {
                      title: '非空',
                      dataIndex: 'notnull',
                      key: 'notnull',
                      render: (val) => (val === 1 ? '是' : '否'),
                    },
                    {
                      title: '默认值',
                      dataIndex: 'dflt_value',
                      key: 'dflt_value',
                      render: (val) => val || '-',
                    },
                    {
                      title: '主键',
                      dataIndex: 'pk',
                      key: 'pk',
                      render: (val) => (val === 1 ? '是' : '否'),
                    },
                  ]}
                  dataSource={schema.columns.map((col, index) => ({
                    ...col,
                    key: index,
                  }))}
                />
              </div>
            ) : null,
          },
        ]}
      />

      {/* Data Editor Modal */}
      {schema && (
        <DataEditor
          visible={editorVisible}
          mode={editorMode}
          tableName={tableName}
          columns={schema.columns}
          initialValues={editingRecord}
          onSave={handleSave}
          onCancel={() => setEditorVisible(false)}
        />
      )}
    </div>
  );
}
