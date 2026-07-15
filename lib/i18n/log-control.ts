/**
 * 语言检测日志控制模块
 * 提供控制台命令用于控制日志输出
 */

interface LogControlOptions {
  verbose: boolean
  showDetection: boolean
  showStore: boolean
  showPrompt: boolean
}

class LogControl {
  private options: LogControlOptions = {
    verbose: true,
    showDetection: true,
    showStore: true,
    showPrompt: true,
  }

  constructor() {
    this.setupConsoleCommands()
  }

  // 设置全局控制台命令
  private setupConsoleCommands() {
    if (typeof window !== 'undefined') {
      // 全局日志控制命令
      ;(
        window as unknown as Window & {
          dogeowLogs: {
            disable: () => void
            enable: () => void
            quiet: () => void
            status: () => void
            reset: () => void
          }
        }
      ).dogeowLogs = {
        // 禁用所有语言检测日志
        disable: () => {
          this.options.verbose = false
          this.options.showDetection = false
          this.options.showStore = false
          this.options.showPrompt = false
          console.log('🚫 已禁用所有语言检测日志')
          this.saveOptions()
        },

        // 启用所有语言检测日志
        enable: () => {
          this.options.verbose = true
          this.options.showDetection = true
          this.options.showStore = true
          this.options.showPrompt = true
          console.log('✅ 已启用所有语言检测日志')
          this.saveOptions()
        },

        // 只显示重要日志
        quiet: () => {
          this.options.verbose = false
          this.options.showDetection = true
          this.options.showStore = true
          this.options.showPrompt = false
          console.log('🔇 语言检测日志已切换为安静模式（只显示重要日志）')
          this.saveOptions()
        },

        // 显示当前设置
        status: () => {
          console.log('📊 当前语言检测日志设置:', this.options)
        },

        // 重置到默认设置
        reset: () => {
          this.options = {
            verbose: true,
            showDetection: true,
            showStore: true,
            showPrompt: true,
          }
          console.log('🔄 语言检测日志已重置为默认设置')
          this.saveOptions()
        },
      }

      // 显示帮助信息
      console.log(`
🎯 语言检测日志控制命令：

dogeowLogs.disable()    - 禁用所有语言检测日志
dogeowLogs.enable()     - 启用所有语言检测日志
dogeowLogs.quiet()      - 只显示重要日志
dogeowLogs.status()     - 显示当前设置
dogeowLogs.reset()      - 重置到默认设置

💡 使用这些命令可以快速控制控制台中的语言检测日志输出
      `)

      // 加载保存的设置
      this.loadOptions()
    }
  }

  // 保存设置到本地存储
  private saveOptions() {
    if (typeof window !== 'undefined') {
      window.localStorage.setItem('dogeow-log-control', JSON.stringify(this.options))
    }
  }

  // 从本地存储加载设置
  private loadOptions() {
    if (typeof window !== 'undefined') {
      try {
        const saved = window.localStorage.getItem('dogeow-log-control')
        if (saved) {
          this.options = { ...this.options, ...JSON.parse(saved) }
        }
      } catch (error) {
        console.warn('加载日志控制设置失败:', error)
      }
    }
  }

  /**
   * 检查是否应该输出检测相关日志
   */
  shouldLogDetection(): boolean {
    return this.options.verbose && this.options.showDetection
  }

  /**
   * 检查是否应该输出存储相关日志
   */
  shouldLogStore(): boolean {
    return this.options.verbose && this.options.showStore
  }

  /**
   * 检查是否应该输出提示相关日志
   */
  shouldLogPrompt(): boolean {
    return this.options.verbose && this.options.showPrompt
  }

  /**
   * 检查是否应该输出详细日志
   */
  shouldLogVerbose(): boolean {
    return this.options.verbose
  }

  /**
   * 获取当前日志控制选项
   */
  getOptions(): LogControlOptions {
    return { ...this.options }
  }

  /**
   * 更新日志控制选项
   */
  updateOptions(newOptions: Partial<LogControlOptions>) {
    this.options = { ...this.options, ...newOptions }
    this.saveOptions()
  }
}

// 创建全局实例
export const logControl = new LogControl()

// 导出检查函数
export const shouldLogDetection = () => logControl.shouldLogDetection()
export const shouldLogStore = () => logControl.shouldLogStore()
export const shouldLogPrompt = () => logControl.shouldLogPrompt()
export const shouldLogVerbose = () => logControl.shouldLogVerbose()
