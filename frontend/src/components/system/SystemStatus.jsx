import React, { useState, useEffect } from 'react'
import { Card, CardContent, CardHeader, CardTitle } from '../ui/card'
import { Badge } from '../ui/badge'
import { Button } from '../ui/button'
import { Separator } from '../ui/separator'
import { Progress } from '../ui/progress'
import { 
  Cpu, 
  HardDrive, 
  Zap, 
  Brain, 
  RefreshCw, 
  CheckCircle, 
  AlertCircle, 
  XCircle,
  Monitor,
  MemoryStick
} from 'lucide-react'
import { motion } from 'framer-motion'
import axios from 'axios'

const SystemStatus = () => {
  const [systemData, setSystemData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [lastUpdated, setLastUpdated] = useState(null)

  const fetchSystemStatus = async () => {
    setLoading(true)
    setError(null)
    
    try {
      const response = await axios.get(`${import.meta.env.VITE_API_URL}/health/detailed`)
      setSystemData(response.data)
      setLastUpdated(new Date())
    } catch (err) {
      setError(err.response?.data?.detail || 'Failed to fetch system status')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchSystemStatus()
    // Auto-refresh every 30 seconds
    const interval = setInterval(fetchSystemStatus, 30000)
    return () => clearInterval(interval)
  }, [])

  const getStatusColor = (status) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return 'text-green-600'
      case 'warning':
        return 'text-yellow-600'
      case 'error':
        return 'text-red-600'
      default:
        return 'text-gray-600'
    }
  }

  const getStatusIcon = (status) => {
    switch (status) {
      case 'healthy':
      case 'ok':
        return <CheckCircle className="h-4 w-4 text-green-600" />
      case 'warning':
        return <AlertCircle className="h-4 w-4 text-yellow-600" />
      case 'error':
        return <XCircle className="h-4 w-4 text-red-600" />
      default:
        return <AlertCircle className="h-4 w-4 text-gray-600" />
    }
  }

  const formatBytes = (bytes) => {
    return `${bytes.toFixed(1)} GB`
  }

  const formatPercent = (percent) => {
    return `${percent.toFixed(1)}%`
  }

  if (error) {
    return (
      <Card className="w-full">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <XCircle className="h-5 w-5 text-red-600" />
            System Status - Error
          </CardTitle>
        </CardHeader>
        <CardContent>
          <div className="text-red-600 mb-4">{error}</div>
          <Button onClick={fetchSystemStatus} disabled={loading}>
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Retry
          </Button>
        </CardContent>
      </Card>
    )
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <Card className="w-full">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="flex items-center gap-2">
              {systemData && getStatusIcon(systemData.status)}
              System Status
            </CardTitle>
            <div className="flex items-center gap-2">
              {lastUpdated && (
                <span className="text-sm text-muted-foreground">
                  Updated: {lastUpdated.toLocaleTimeString()}
                </span>
              )}
              <Button 
                variant="outline" 
                size="sm" 
                onClick={fetchSystemStatus}
                disabled={loading}
              >
                <RefreshCw className={`h-4 w-4 ${loading ? 'animate-spin' : ''}`} />
              </Button>
            </div>
          </div>
        </CardHeader>

        <CardContent className="space-y-6">
          {systemData && (
            <>
              {/* Service Status */}
              <div>
                <h3 className="text-lg font-semibold mb-3">Service Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div className="flex items-center gap-2">
                    <Badge variant={systemData.status === 'healthy' ? 'default' : 'destructive'}>
                      {systemData.status}
                    </Badge>
                    <span className="text-sm">{systemData.service}</span>
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Version: {systemData.version}
                  </div>
                  <div className="text-sm text-muted-foreground">
                    Python: {systemData.environment?.python_version}
                  </div>
                </div>
              </div>

              <Separator />

              {/* System Resources */}
              <div>
                <h3 className="text-lg font-semibold mb-3">System Resources</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  
                  {/* CPU */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Cpu className="h-4 w-4" />
                      <span className="font-medium">CPU Usage</span>
                    </div>
                    <Progress value={systemData.system?.cpu_percent || 0} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      {formatPercent(systemData.system?.cpu_percent || 0)}
                    </div>
                  </div>

                  {/* Memory */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <MemoryStick className="h-4 w-4" />
                      <span className="font-medium">Memory Usage</span>
                    </div>
                    <Progress value={systemData.system?.memory?.percent || 0} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      {formatBytes(systemData.system?.memory?.used_gb || 0)} / {formatBytes(systemData.system?.memory?.total_gb || 0)}
                      ({formatPercent(systemData.system?.memory?.percent || 0)})
                    </div>
                  </div>

                  {/* Disk */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <HardDrive className="h-4 w-4" />
                      <span className="font-medium">Disk Usage</span>
                    </div>
                    <Progress value={systemData.system?.disk?.percent || 0} className="h-2" />
                    <div className="text-sm text-muted-foreground">
                      {formatBytes(systemData.system?.disk?.used_gb || 0)} / {formatBytes(systemData.system?.disk?.total_gb || 0)}
                      ({formatPercent(systemData.system?.disk?.percent || 0)})
                    </div>
                  </div>

                  {/* GPU */}
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Zap className="h-4 w-4" />
                      <span className="font-medium">GPU Status</span>
                    </div>
                    {systemData.gpu?.available ? (
                      <>
                        <div className="text-sm">
                          <Badge variant="default" className="mb-2">Available</Badge>
                          <div className="text-muted-foreground">
                            {systemData.gpu.device_name}
                          </div>
                          <div className="text-muted-foreground">
                            Memory: {formatBytes(systemData.gpu.memory_allocated_gb)} / {formatBytes(systemData.gpu.memory_total_gb)}
                          </div>
                        </div>
                      </>
                    ) : (
                      <Badge variant="secondary">CPU Only</Badge>
                    )}
                  </div>
                </div>
              </div>

              <Separator />

              {/* AI Models */}
              <div>
                <h3 className="text-lg font-semibold mb-3">AI Models</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Brain className="h-4 w-4" />
                      <span className="font-medium">Loaded Models</span>
                    </div>
                    <div className="text-2xl font-bold">
                      {systemData.models?.model_count || 0}
                    </div>
                    <div className="text-sm text-muted-foreground">
                      Max: {systemData.models?.max_models || 'N/A'}
                    </div>
                  </div>

                  <div className="space-y-2">
                    <div className="flex items-center gap-2">
                      <Monitor className="h-4 w-4" />
                      <span className="font-medium">Device</span>
                    </div>
                    <Badge variant={systemData.models?.device === 'cuda' ? 'default' : 'secondary'}>
                      {systemData.models?.device?.toUpperCase() || 'Unknown'}
                    </Badge>
                    <div className="text-sm text-muted-foreground">
                      PyTorch: {systemData.environment?.torch_version}
                    </div>
                  </div>
                </div>

                {systemData.models?.loaded_models?.length > 0 && (
                  <div className="mt-4">
                    <h4 className="font-medium mb-2">Currently Loaded:</h4>
                    <div className="flex flex-wrap gap-2">
                      {systemData.models.loaded_models.map((model, index) => (
                        <Badge key={index} variant="outline" className="text-xs">
                          {model.replace('facebook/', '').replace('google/', '').replace('openai/', '')}
                        </Badge>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </>
          )}

          {loading && !systemData && (
            <div className="flex items-center justify-center py-8">
              <RefreshCw className="h-6 w-6 animate-spin mr-2" />
              <span>Loading system status...</span>
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  )
}

export default SystemStatus
