import { useState, useRef } from 'react';
import { Button, Space, message, Table, Statistic, Card, Row, Col } from 'antd';
import {
  PlayCircleOutlined,
  ClearOutlined,
  ClockCircleOutlined,
} from '@ant-design/icons';
import Editor from '@monaco-editor/react';
import type { DatabaseConnection, QueryResult } from '../types';
import { apiService } from '../services/api';

interface SqlEditorProps {
  connection?: DatabaseConnection;
}

export default function SqlEditor({ connection }: SqlEditorProps) {
  const [sql, setSql] = useState('-- 输入 SQL 查询\nSELECT * FROM sqlite_master WHERE type=\'table\';');
  const [executing, setExecuting] = useState(false);
  const [result, setResult] = useState<QueryResult | null>(null);
  const [duration, setDuration] = useState<number>(0);
  const editorRef = useRef<any>(null);

  const handleEditorDidMount = (editor: any) => {
    editorRef.current = editor;
  };

  const handleExecute = async () => {
    if (!connection) {
      message.warning('请先选择数据库连接');
      return;
    }

    if (!sql.trim()) {
      message.warning('请输入 SQL 查询');
      return;
    }

    setExecuting(true);
    const startTime = Date.now();

    try {
      const response = await apiService.executeQuery(sql, connection);
      const endTime = Date.now();
      setDuration(endTime - startTime);

      if (response.success && response.data) {
        setResult(response.data);
        message.success('查询执行成功');
      } else {
        message.error(response.error || '查询执行失败');
        setResult(null);
      }
    } catch (error) {
      console.error('Query execution failed:', error);
      message.error('查询执行失败');
      setResult(null);
    } finally {
      setExecuting(false);
    }
  };

  const handleClear = () => {
    setSql('');
    setResult(null);
    setDuration(0);
  };

  // Convert query result to table data
  const tableColumns = result?.columns.map((col) => ({
    title: col,
    dataIndex: col,
    key: col,
    ellipsis: true,
  })) || [];

  const tableData = result?.rows.map((row, index) => {
    const record: any = { key: index };
    result.columns.forEach((col, colIndex) => {
      record[col] = row[colIndex];
    });
    return record;
  }) || [];

  return (
    <div style={{ height: '100%', display: 'flex', flexDirection: 'column' }}>
      {/* Editor Section */}
      <div style={{ borderBottom: '1px solid #f0f0f0' }}>
        <div
          style={{
            padding: '8px 16px',
            background: '#fafafa',
            borderBottom: '1px solid #f0f0f0',
          }}
        >
          <Space>
            <Button
              type="primary"
              icon={<PlayCircleOutlined />}
              onClick={handleExecute}
              loading={executing}
              disabled={!connection}
            >
              执行 (Ctrl+Enter)
            </Button>
            <Button icon={<ClearOutlined />} onClick={handleClear}>
              清空
            </Button>
            {duration > 0 && (
              <span style={{ color: '#999', fontSize: 12 }}>
                <ClockCircleOutlined /> 耗时: {duration}ms
              </span>
            )}
          </Space>
        </div>

        <div style={{ height: 250, border: '1px solid #d9d9d9' }}>
          <Editor
            height="100%"
            defaultLanguage="sql"
            value={sql}
            onChange={(value) => setSql(value || '')}
            onMount={handleEditorDidMount}
            theme="vs-light"
            options={{
              minimap: { enabled: false },
              fontSize: 14,
              lineNumbers: 'on',
              scrollBeyondLastLine: false,
              automaticLayout: true,
              tabSize: 2,
            }}
          />
        </div>
      </div>

      {/* Results Section */}
      <div style={{ flex: 1, overflow: 'auto', padding: 16 }}>
        {result ? (
          <>
            <Row gutter={16} style={{ marginBottom: 16 }}>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="返回行数"
                    value={result.rows.length}
                    suffix="行"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="列数"
                    value={result.columns.length}
                    suffix="列"
                  />
                </Card>
              </Col>
              <Col span={8}>
                <Card size="small">
                  <Statistic
                    title="执行时间"
                    value={duration}
                    suffix="ms"
                  />
                </Card>
              </Col>
            </Row>

            <Table
              columns={tableColumns}
              dataSource={tableData}
              size="small"
              bordered
              pagination={{
                pageSize: 50,
                showSizeChanger: true,
                showTotal: (total) => `共 ${total} 条记录`,
              }}
              scroll={{ x: 'max-content' }}
            />
          </>
        ) : (
          <div
            style={{
              textAlign: 'center',
              padding: '60px 0',
              color: '#999',
            }}
          >
            {connection
              ? '执行 SQL 查询后，结果将显示在这里'
              : '请先选择数据库连接'}
          </div>
        )}
      </div>
    </div>
  );
}
