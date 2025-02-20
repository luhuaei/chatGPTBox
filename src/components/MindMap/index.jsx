import { useEffect, useRef } from 'react'
import PropTypes from 'prop-types'
import { Markmap, loadCSS, loadJS } from 'markmap-view';
import { Transformer } from 'markmap-lib'

const transformer = new Transformer()
const { styles } = transformer.getAssets();
loadCSS(styles);

// 清理 markdown 内容的函数
function cleanMarkdown(markdown) {
  if (!markdown) return '';
  
  // 移除开头和结尾的反引号块
  let cleaned = markdown.replace(/^```[\s\S]*?\n/, '').replace(/\n```$/, '');
  
  // 移除多余的空行
  cleaned = cleaned.replace(/\n{3,}/g, '\n\n');
  
  // 确保标题格式正确（#号后面有空格）
  cleaned = cleaned.replace(/^(#{1,6})([^\s#])/gm, '$1 $2');
  
  // 移除不必要的特殊字符
  cleaned = cleaned.replace(/[""'']/g, '');
  
  // 确保列表格式正确（-号后面有空格）
  cleaned = cleaned.replace(/^-([^\s-])/gm, '- $1');
  
  // 移除每行开头和结尾的空格
  cleaned = cleaned.split('\n').map(line => line.trim()).join('\n');
  
  // 确保文档以单个换行结束
  cleaned = cleaned.trim() + '\n';
  
  return cleaned;
}

function MindMap({ markdown }) {
  const svgRef = useRef(null)
  const mmRef = useRef(null)

  useEffect(() => {
    if (svgRef.current) {
      // 清除旧的内容
      svgRef.current.innerHTML = ''

      try {
        // 清理并转换markdown为思维导图数据
        const cleanedMarkdown = cleanMarkdown(markdown);
        console.log('Cleaned markdown:', cleanedMarkdown);
        
        // 创建思维导图
        const mm = Markmap.create(svgRef.current)
        const { root } = transformer.transform(cleanedMarkdown)
        console.log('Transformed root:', root)
        mm.setData(root)
        mm.fit()

        mmRef.current = mm
      } catch (error) {
        console.error('Failed to create mind map:', error)
      }
    }

    // 清理函数
    return () => {
      if (mmRef.current) {
        mmRef.current = null
      }
    }
  }, [markdown])

  return (
    <div style={{ width: '100%', height: '100%', overflow: 'hidden', position: 'relative' }}>
      <svg
        ref={svgRef}
        style={{
          width: '100%',
          height: '100%',
          display: 'block',
          position: 'absolute',
          left: 0,
          top: 0,
        }}
      />
    </div>
  )
}

MindMap.propTypes = {
  markdown: PropTypes.string.isRequired,
}

export default MindMap
