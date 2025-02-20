import { useEffect, useState } from 'react'
import MindMap from '../components/MindMap'
import Browser from 'webextension-polyfill'
import { useTranslation } from 'react-i18next'
import { getUserConfig } from '../config'

function MindMapPage() {
  const [markdown, setMarkdown] = useState('')
  const { t } = useTranslation()
  const [downloading, setDownloading] = useState(false)

  useEffect(() => {
    // 监听来自 content script 的消息
    Browser.runtime.onMessage.addListener((message) => {
      if (message.type === 'MINDMAP_INIT') {
        const { content } = message.data
	console.log("receive content", content)
	Browser.tabs.getCurrent().then(tab => {
	  // 发送消息给后台处理
          Browser.runtime.sendMessage({
            type: 'GENERATE_MINDMAP',
            data: {
              content,
	      tabId: tab.id,
            },
          })
	})
      } else if (message.type === 'MINDMAP_DATA') {
	console.log("markdown ", message.data.markdown)
        setMarkdown(message.data.markdown)
      }
    })
  }, [])

  const handleDownload = () => {
    if (downloading) return
    setDownloading(true)

    try {
      // 获取svg内容
      const svg = document.querySelector('svg')
      if (!svg) return

      // 创建一个新的svg元素，复制原始svg的内容
      const clonedSvg = svg.cloneNode(true)

      // 设置svg的尺寸
      clonedSvg.setAttribute('width', svg.clientWidth)
      clonedSvg.setAttribute('height', svg.clientHeight)

      // 将svg转换为blob
      const svgData = new XMLSerializer().serializeToString(clonedSvg)
      const blob = new Blob([svgData], { type: 'image/svg+xml;charset=utf-8' })

      // 创建下载链接
      const url = URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      link.download = 'mindmap.svg'
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      URL.revokeObjectURL(url)
    } catch (error) {
      console.error('下载失败:', error)
    } finally {
      setDownloading(false)
    }
  }

  return (
    <div style={{ width: '100vw', height: '100vh', display: 'flex', flexDirection: 'column' }}>
      <div style={{
        padding: '10px',
        borderBottom: '1px solid #ccc',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <h2 style={{ margin: 0 }}>{t('Mind Map')}</h2>
        <button
          onClick={handleDownload}
          disabled={downloading || !markdown}
          style={{
            padding: '8px 16px',
            backgroundColor: '#1a73e8',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: downloading || !markdown ? 'not-allowed' : 'pointer',
            opacity: downloading || !markdown ? 0.6 : 1
          }}
        >
          {downloading ? t('Downloading...') : t('Download SVG')}
        </button>
      </div>
      <div style={{ flex: 1, overflow: 'hidden' }}>
        {markdown ? (
          <MindMap markdown={markdown} />
        ) : (
          <div style={{
            display: 'flex',
            justifyContent: 'center',
            alignItems: 'center',
            height: '100%',
            color: '#666'
          }}>
            {t('Waiting for content...')}
          </div>
        )}
      </div>
    </div>
  )
}

export default MindMapPage
