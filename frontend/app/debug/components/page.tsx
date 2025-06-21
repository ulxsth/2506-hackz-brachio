'use client';

import React, { useState } from 'react';
import { 
  Button, 
  Input, 
  TextArea, 
  Select, 
  Card, 
  CardHeader, 
  CardTitle, 
  CardDescription, 
  CardContent, 
  CardFooter,
  Modal 
} from '../../../components/ui';

export default function ComponentsDebugPage() {
  const [modalOpen, setModalOpen] = useState(false);
  const [inputValue, setInputValue] = useState('');
  const [textAreaValue, setTextAreaValue] = useState('');
  const [selectValue, setSelectValue] = useState('');

  return (
    <div className="space-y-8 p-4">
      <div className="space-y-4">
        <h1 className="text-2xl font-bold font-mono text-terminalText">コンポーネント一覧</h1>
        <p className="font-mono text-terminalText">ターミナルUIコンポーネントのデモページです。</p>
      </div>

      {/* Button コンポーネント */}
      <Card>
        <CardHeader>
          <CardTitle>Button</CardTitle>
          <CardDescription>ボタンコンポーネントの各バリエーション</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Variants */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm font-bold">Variants</h3>
            <div className="flex flex-wrap gap-2">
              <Button variant="primary">Primary</Button>
              <Button variant="secondary">Secondary</Button>
              <Button variant="outline">Outline</Button>
              <Button variant="ghost">Ghost</Button>
              <Button variant="danger">Danger</Button>
            </div>
          </div>

          {/* Sizes */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm font-bold">Sizes</h3>
            <div className="flex flex-wrap gap-2 items-center">
              <Button size="sm">Small</Button>
              <Button size="md">Medium</Button>
              <Button size="lg">Large</Button>
            </div>
          </div>

          {/* Disabled */}
          <div className="space-y-2">
            <h3 className="font-mono text-sm font-bold">Disabled</h3>
            <div className="flex gap-2">
              <Button disabled>Disabled Primary</Button>
              <Button variant="outline" disabled>Disabled Outline</Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Input コンポーネント */}
      <Card>
        <CardHeader>
          <CardTitle>Input</CardTitle>
          <CardDescription>入力フィールドコンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Input 
            label="基本的な入力"
            placeholder="何か入力してください..."
            value={inputValue}
            onChange={(e) => setInputValue(e.target.value)}
          />
          
          <Input 
            label="パスワード入力"
            type="password"
            placeholder="パスワードを入力..."
          />
          
          <Input 
            label="エラー状態"
            error="このフィールドは必須です"
            placeholder="エラー表示例"
          />
          
          <Input 
            label="無効化"
            disabled
            placeholder="無効化された入力"
          />
        </CardContent>
      </Card>

      {/* TextArea コンポーネント */}
      <Card>
        <CardHeader>
          <CardTitle>TextArea</CardTitle>
          <CardDescription>複数行テキスト入力コンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <TextArea 
            label="メッセージ"
            placeholder="複数行のテキストを入力してください..."
            rows={4}
            value={textAreaValue}
            onChange={(e) => setTextAreaValue(e.target.value)}
          />
          
          <TextArea 
            label="エラー状態"
            error="内容が不正です"
            placeholder="エラー表示例"
            rows={3}
          />
        </CardContent>
      </Card>

      {/* Select コンポーネント */}
      <Card>
        <CardHeader>
          <CardTitle>Select</CardTitle>
          <CardDescription>選択コンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Select 
            label="プログラミング言語"
            value={selectValue}
            onChange={(e) => setSelectValue(e.target.value)}
          >
            <option value="">選択してください</option>
            <option value="javascript">JavaScript</option>
            <option value="typescript">TypeScript</option>
            <option value="python">Python</option>
            <option value="rust">Rust</option>
            <option value="go">Go</option>
          </Select>
          
          <Select 
            label="エラー状態"
            error="選択が必要です"
          >
            <option value="">エラー表示例</option>
            <option value="option1">オプション1</option>
            <option value="option2">オプション2</option>
          </Select>
        </CardContent>
      </Card>

      {/* Card コンポーネント */}
      <Card>
        <CardHeader>
          <CardTitle>Card</CardTitle>
          <CardDescription>カードコンポーネントの構造例</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <Card>
              <CardHeader>
                <CardTitle>シンプルカード</CardTitle>
                <CardDescription>基本的なカード例</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm">
                  これはカードのコンテンツエリアです。
                  ターミナル風のデザインで統一されています。
                </p>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle>フッター付きカード</CardTitle>
                <CardDescription>フッター要素を含むカード</CardDescription>
              </CardHeader>
              <CardContent>
                <p className="font-mono text-sm">
                  フッターにボタンなどのアクション要素を配置できます。
                </p>
              </CardContent>
              <CardFooter>
                <Button size="sm">アクション</Button>
              </CardFooter>
            </Card>
          </div>
        </CardContent>
      </Card>

      {/* Modal コンポーネント */}
      <Card>
        <CardHeader>
          <CardTitle>Modal</CardTitle>
          <CardDescription>モーダルダイアログコンポーネント</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button onClick={() => setModalOpen(true)}>
            モーダルを開く
          </Button>
          
          <div className="text-sm font-mono text-terminalText opacity-70">
            <p>• ESCキーで閉じることができます</p>
            <p>• オーバーレイクリックで閉じることができます</p>
            <p>• モーダル表示中はページスクロールが無効になります</p>
          </div>
        </CardContent>
      </Card>

      {/* 使用中の値を表示 */}
      <Card>
        <CardHeader>
          <CardTitle>現在の値</CardTitle>
          <CardDescription>各コンポーネントの現在の状態</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="space-y-2 font-mono text-sm">
            <div>Input値: <span className="text-terminalBorder">{inputValue || '(空)'}</span></div>
            <div>TextArea値: <span className="text-terminalBorder">{textAreaValue || '(空)'}</span></div>
            <div>Select値: <span className="text-terminalBorder">{selectValue || '(未選択)'}</span></div>
          </div>
        </CardContent>
      </Card>

      {/* Modal */}
      <Modal 
        isOpen={modalOpen} 
        onClose={() => setModalOpen(false)}
        title="サンプルモーダル"
        className="max-w-lg"
      >
        <div className="space-y-4">
          <p className="font-mono text-sm">
            これはモーダルダイアログのサンプルです。
            ターミナル風のデザインで統一されています。
          </p>
          
          <Input 
            label="モーダル内の入力"
            placeholder="モーダル内でも入力できます"
          />
          
          <div className="flex gap-2 justify-end">
            <Button variant="outline" onClick={() => setModalOpen(false)}>
              キャンセル
            </Button>
            <Button onClick={() => setModalOpen(false)}>
              OK
            </Button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
