// Chart data for different time ranges
        let chartData = {
            'live': {
                labels: [],
                upload: [],
                download: [],
                title: 'Network Traffic (Live)'
            },
            '1hour': {
                labels: [],
                upload: [],
                download: [],
                title: 'Network Traffic (Last 1 Hour)'
            },
            '24hours': {
                labels: [],
                upload: [],
                download: [],
                title: 'Network Traffic (Last 24 Hours)'
            },
            '7days': {
                labels: [],
                upload: [],
                download: [],
                title: 'Network Traffic (Last 7 Days)'
            },
            '30days': {
                labels: [],
                upload: [],
                download: [],
                title: 'Network Traffic (Last 30 Days)'
            }
        };

        // Initialize traffic chart
        const ctx = document.getElementById('trafficChart').getContext('2d');
        let currentTimeRange = 'live';
        
        const trafficChart = new Chart(ctx, {
            type: 'line',
            data: {
                labels: chartData[currentTimeRange].labels,
                datasets: [{
                    label: 'Upload',
                    data: chartData[currentTimeRange].upload,
                    borderColor: '#6366f1',
                    backgroundColor: 'rgba(99, 102, 241, 0.1)',
                    tension: 0.4,
                    fill: true
                }, {
                    label: 'Download',
                    data: chartData[currentTimeRange].download,
                    borderColor: '#10b981',
                    backgroundColor: 'rgba(16, 185, 129, 0.1)',
                    tension: 0.4,
                    fill: true
                }]
            },
            options: {
                responsive: true,
                maintainAspectRatio: false,
                interaction: {
                    intersect: false,
                    mode: 'index'
                },
                plugins: {
                    legend: {
                        position: 'bottom',
                        labels: {
                            usePointStyle: true,
                            padding: 20
                        }
                    }
                },
                scales: {
                    y: {
                        beginAtZero: true,
                        grid: {
                            color: 'rgba(0, 0, 0, 0.05)'
                        },
                        ticks: {
                            callback: function(value) {
                                return value + ' Mbps';
                            }
                        }
                    },
                    x: {
                        grid: {
                            display: false
                        }
                    }
                }
            }
        });

        // Network info for real-time updates
        let previousBandwidth = null;
        let previousLatency = null;
        let deviceData = [];
        let ipConnections = [];
        let securityAlerts = [];

        async function updateNetworkInfo() {
            let currentBandwidth = 0;
            let currentLatency = 0;
            let packetLoss = 0;
            
            // Measure packet loss with 10 ping attempts
            const attempts = 10;
            let failures = 0;
            for (let i = 0; i < attempts; i++) {
                try {
                    const controller = new AbortController();
                    const timeoutId = setTimeout(() => controller.abort(), 2000);
                    await fetch('https://www.google.com/generate_204', { signal: controller.signal });
                    clearTimeout(timeoutId);
                } catch (e) {
                    failures++;
                }
            }
            packetLoss = ((failures / attempts) * 100).toFixed(2);
            
            if ('connection' in navigator) {
                const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
                currentBandwidth = connection.downlink;
                currentLatency = connection.rtt;
            } else {
                // Fallback for latency
                const start = performance.now();
                try {
                    await fetch('https://www.google.com/generate_204');
                    currentLatency = Math.round(performance.now() - start);
                } catch (e) {
                    currentLatency = 'N/A';
                }
                currentBandwidth = 'N/A';
            }

            // Update DOM
            const bandwidthElem = document.getElementById('bandwidth');
            const latencyElem = document.getElementById('latency');
            const packetLossElem = document.getElementById('packetLoss');
            const devicesElem = document.getElementById('devices');
            const bandwidthChange = bandwidthElem.nextElementSibling;
            const latencyChange = latencyElem.nextElementSibling;
            const packetLossChange = packetLossElem.nextElementSibling;
            const devicesChange = devicesElem.nextElementSibling;

            if (currentBandwidth !== 'N/A') {
                bandwidthElem.textContent = `${currentBandwidth} Mbps`;
                if (currentTimeRange === 'live') {
                    const now = new Date().toLocaleTimeString();
                    chartData['live'].labels.push(now);
                    chartData['live'].upload.push(Math.floor(currentBandwidth * 0.3)); // Assume upload is ~30% of download
                    chartData['live'].download.push(currentBandwidth);
                    if (chartData['live'].labels.length > 20) {
                        chartData['live'].labels.shift();
                        chartData['live'].upload.shift();
                        chartData['live'].download.shift();
                    }
                    trafficChart.data.labels = chartData['live'].labels;
                    trafficChart.data.datasets[0].data = chartData['live'].upload;
                    trafficChart.data.datasets[1].data = chartData['live'].download;
                    trafficChart.update('none');
                }
                if (previousBandwidth !== null) {
                    const diff = ((currentBandwidth - previousBandwidth) / previousBandwidth * 100).toFixed(0);
                    const sign = diff > 0 ? '↑' : '↓';
                    bandwidthChange.textContent = `${sign} ${Math.abs(diff)}% change`;
                    bandwidthChange.classList.remove('text-green-600', 'text-red-600', 'text-gray-600');
                    bandwidthChange.classList.add(diff >= 0 ? 'text-green-600' : 'text-red-600');
                } else {
                    bandwidthChange.textContent = 'Current bandwidth';
                    bandwidthChange.classList.add('text-gray-600');
                }
                previousBandwidth = currentBandwidth;
            }
            if (currentLatency !== 'N/A') {
                latencyElem.textContent = `${currentLatency}ms`;
                if (previousLatency !== null) {
                    const diff = currentLatency - previousLatency;
                    const sign = diff > 0 ? '↑' : '↓';
                    latencyChange.textContent = `${sign} ${Math.abs(diff)}ms change`;
                    latencyChange.classList.remove('text-green-600', 'text-red-600', 'text-gray-600');
                    latencyChange.classList.add(diff <= 0 ? 'text-green-600' : 'text-red-600');
                } else {
                    latencyChange.textContent = 'Current latency';
                    latencyChange.classList.add('text-gray-600');
                }
                previousLatency = currentLatency;
            }
            packetLossElem.textContent = `${packetLoss}%`;
            devicesElem.textContent = '1';
            devicesChange.textContent = `${navigator.userAgent.includes('Mobile') ? 'Mobile' : 'Desktop'} device`;
        }

        // Fetch network devices (replace with actual API)
        async function fetchNetworkDevices() {
            try {
                const response = await fetch('YOUR_API_URL/devices', {
                    headers: {
                        'Authorization': 'Bearer YOUR_API_KEY_HERE'
                    }
                });
                const data = await response.json();
                deviceData = data.devices.map((device, index) => ({
                    id: index + 1,
                    name: device.name || `Device ${index + 1}`,
                    ip: device.ip || `192.168.1.${index + 100}`,
                    mac: device.mac || `00:1B:44:11:3A:${index.toString(16).padStart(2, '0')}`,
                    type: device.type || 'unknown',
                    category: device.category || 'Unknown',
                    activity: device.activity || 'Unknown',
                    bandwidth: device.bandwidth || 0,
                    bandwidthLimit: device.bandwidthLimit || 100,
                    status: device.status || 'active',
                    color: device.color || 'blue',
                    lastSeen: new Date(device.lastSeen || Date.now())
                }));
            } catch (e) {
                // Fallback to current device
                deviceData = [{
                    id: 1,
                    name: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Desktop Device',
                    ip: '192.168.1.100',
                    mac: '00:1B:44:11:3A:00',
                    type: navigator.userAgent.includes('Mobile') ? 'mobile' : 'computer',
                    category: navigator.userAgent.includes('Mobile') ? 'Mobile Device' : 'Workstation',
                    activity: 'Web browsing',
                    bandwidth: 0,
                    bandwidthLimit: 100,
                    status: 'active',
                    color: 'blue',
                    lastSeen: new Date()
                }];
            }
            renderTopDevices();
        }

        // Fetch IP connections (replace with actual API)
        async function fetchIPConnections() {
            try {
                const response = await fetch('YOUR_API_URL/connections', {
                    headers: {
                        'Authorization': 'Bearer YOUR_API_KEY_HERE'
                    }
                });
                const data = await response.json();
                ipConnections = data.connections.map((conn, index) => ({
                    id: index + 1,
                    ip: conn.ip,
                    location: conn.location || 'Unknown',
                    connections: conn.connections || 0,
                    dataTransfer: conn.dataTransfer || '0 MB',
                    status: conn.status || 'unknown',
                    riskLevel: conn.riskLevel || 'low',
                    lastActivity: new Date(conn.lastActivity || Date.now()),
                    blocked: conn.blocked || false,
                    suspicious: conn.suspicious || false
                }));
            } catch (e) {
                // Fallback to public IP
                const publicIP = await fetch('https://ipinfo.io/json?token=0fdb2c830ee90a').then(res => res.json());
                ipConnections = [{
                    id: 1,
                    ip: publicIP.ip,
                    location: `${publicIP.city}, ${publicIP.country}`,
                    connections: 1,
                    dataTransfer: '0 MB',
                    status: 'trusted',
                    riskLevel: 'low',
                    lastActivity: new Date(),
                    blocked: false,
                    suspicious: false
                }];
            }
            renderIPConnections();
            updateIPStats();
        }

        // Fetch security alerts (replace with actual API)
        async function fetchSecurityAlerts() {
            try {
                const response = await fetch('YOUR_API_URL/alerts', {
                    headers: {
                        'Authorization': 'Bearer YOUR_API_KEY_HERE'
                    }
                });
                const data = await response.json();
                securityAlerts = data.alerts.map((alert, index) => ({
                    id: index + 1,
                    type: alert.type || 'intrusion',
                    severity: alert.severity || 'low',
                    message: alert.message || 'Security event detected',
                    device: alert.device || 'Unknown',
                    timestamp: new Date(alert.timestamp || Date.now()),
                    status: alert.status || 'active'
                }));
            } catch (e) {
                securityAlerts = [];
            }
            renderSecurityAlerts();
        }

        // Function to update chart data
        function updateChart(timeRange) {
            currentTimeRange = timeRange;
            const data = chartData[timeRange];
            
            trafficChart.data.labels = data.labels;
            trafficChart.data.datasets[0].data = data.upload;
            trafficChart.data.datasets[1].data = data.download;
            trafficChart.update('none');
            
            document.getElementById('chartTitle').textContent = data.title;
        }

        // Add IP card with ipinfo.io
        function addIPCard() {
            fetch('https://ipinfo.io/json?token=0fdb2c830ee90a')
                .then(res => res.json())
                .then(data => {
                    const grid = document.querySelector('.grid.grid-cols-1.md\\:grid-cols-2.lg\\:grid-cols-4');
                    const newCard = document.createElement('div');
                    newCard.className = 'bg-white rounded-xl p-6 card-shadow metric-card';
                    newCard.innerHTML = `
                        <div class="flex items-center justify-between">
                            <div>
                                <p class="text-sm font-medium text-gray-600">Public IP Address</p>
                                <p class="text-2xl font-bold text-gray-900">${data.ip}</p>
                                <p class="text-xs text-gray-500 mt-1">${data.city}, ${data.country} • ${data.org}</p>
                            </div>
                            <div class="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
                                <svg class="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
                                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"></path>
                                </svg>
                            </div>
                        </div>
                    `;
                    grid.appendChild(newCard);
                    grid.classList.remove('lg:grid-cols-4');
                    grid.classList.add('lg:grid-cols-5');
                })
                .catch(err => console.error('Error fetching IP info:', err));
        }

        // Function to get device icon
        function getDeviceIcon(type) {
            const icons = {
                computer: '<path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"></path>',
                iot: '<path d="M2 3a1 1 0 011-1h2.153a1 1 0 01.986.836l.74 4.435a1 1 0 01-.54 1.06l-1.548.773a11.037 11.037 0 006.105 6.105l.774-1.548a1 1 0 011.059-.54l4.435.74a1 1 0 01.836.986V17a1 1 0 01-1 1h-2C7.82 18 2 12.18 2 5V3z"></path>',
                camera: '<path fill-rule="evenodd" d="M4 5a2 2 0 00-2 2v8a2 2 0 002 2h12a2 2 0 002-2V7a2 2 0 00-2-2h-1.586l-.707-.707A1 1 0 0013 4H7a1 1 0 00-.707.293L5.586 5H4zm6 9a3 3 0 100-6 3 3 0 000 6z" clip-rule="evenodd"></path>',
                printer: '<path fill-rule="evenodd" d="M5 4v3H4a2 2 0 00-2 2v3a2 2 0 002 2h1v2a2 2 0 002 2h6a2 2 0 002-2v-2h1a2 2 0 002-2V9a2 2 0 00-2-2h-1V4a2 2 0 00-2-2H7a2 2 0 00-2 2zm8 0H7v3h6V4zm0 8H7v4h6v-4z" clip-rule="evenodd"></path>',
                mobile: '<path d="M7 2a2 2 0 00-2 2v12a2 2 0 002 2h6a2 2 0 002-2V4a2 2 0 00-2-2H7zM8 4h4v10H8V4zm2 12a1 1 0 100-2 1 1 0 000 2z"></path>',
                tv: '<path fill-rule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h16a2 2 0 002-2V5a2 2 0 00-2-2H4zm16 2H4v10h16V5z" clip-rule="evenodd"></path>'
            };
            return icons[type] || icons.iot;
        }

        // Function to get security alert icon
        function getSecurityIcon(type) {
            const icons = {
                intrusion: '<path fill-rule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clip-rule="evenodd"></path>',
                firewall: '<path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>',
                vpn: '<path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v8a2 2 0 01-2 2h-2.22l.123.489.804.804A1 1 0 0113 18H7a1 1 0 01-.707-1.707l.804-.804L7.22 15H5a2 2 0 01-2-2V5zm5.771 7H5V5h10v7H8.771z" clip-rule="evenodd"></path>'
            };
            return icons[type] || icons.intrusion;
        }

        // Function to toggle device status
        function toggleDeviceStatus(deviceId) {
            const device = deviceData.find(d => d.id === deviceId);
            if (device) {
                device.status = device.status === 'active' ? 'paused' : 'active';
                device.color = device.status === 'active' ? device.color : 'red';
                renderTopDevices();
            }
        }

        // Function to set bandwidth limit
        function setBandwidthLimit(deviceId, limit) {
            const device = deviceData.find(d => d.id === deviceId);
            if (device) {
                device.bandwidthLimit = parseInt(limit);
                alert(`Bandwidth limit for ${device.name} set to ${limit} Mbps`);
            }
        }

        // Function to render top devices with management controls
        function renderTopDevices() {
            const container = document.getElementById('topDevices');
            const sortedDevices = [...deviceData].sort((a, b) => b.bandwidth - a.bandwidth).slice(0, 3);
            
            container.innerHTML = sortedDevices.length ? sortedDevices.map(device => `
                <div class="p-3 bg-gray-50 rounded-lg border ${device.status === 'paused' ? 'border-red-200 bg-red-50' : 'border-gray-200'}">
                    <div class="flex items-center justify-between mb-2">
                        <div class="flex items-center space-x-3">
                            <div class="w-8 h-8 bg-${device.status === 'active' ? device.color : 'red'}-100 rounded-lg flex items-center justify-center">
                                <svg class="w-4 h-4 text-${device.status === 'active' ? device.color : 'red'}-600" fill="currentColor" viewBox="0 0 20 20">
                                    ${getDeviceIcon(device.type)}
                                </svg>
                            </div>
                            <div>
                                <p class="text-sm font-medium text-gray-900">${device.name}</p>
                                <p class="text-xs text-gray-500">${device.ip} • ${device.category}</p>
                            </div>
                        </div>
                        <div class="text-right">
                            <p class="text-sm font-semibold text-gray-900">${device.bandwidth} Mbps</p>
                            <p class="text-xs text-gray-500">${device.activity}</p>
                        </div>
                    </div>
                    <div class="flex items-center justify-between">
                        <div class="flex items-center space-x-2">
                            <span class="text-xs px-2 py-1 rounded-full ${device.status === 'active' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}">
                                ${device.status === 'active' ? 'Active' : 'Paused'}
                            </span>
                            <span class="text-xs text-gray-500">Limit: ${device.bandwidthLimit} Mbps</span>
                        </div>
                        <div class="flex space-x-1">
                            <button onclick="toggleDeviceStatus(${device.id})" class="text-xs px-2 py-1 rounded ${device.status === 'active' ? 'bg-red-100 text-red-700 hover:bg-red-200' : 'bg-green-100 text-green-700 hover:bg-green-200'} transition-colors">
                                ${device.status === 'active' ? 'Pause' : 'Resume'}
                            </button>
                            <button onclick="setBandwidthLimit(${device.id}, prompt('Set bandwidth limit (Mbps):', ${device.bandwidthLimit}))" class="text-xs px-2 py-1 rounded bg-blue-100 text-blue-700 hover:bg-blue-200 transition-colors">
                                Limit
                            </button>
                        </div>
                    </div>
                </div>
            `).join('') : `
                <div class="text-center py-4">
                    <p class="text-sm text-gray-600">No devices detected</p>
                </div>
            `;
        }

        // Function to render security alerts
        function renderSecurityAlerts() {
            const container = document.getElementById('securityAlerts');
            const activeAlerts = securityAlerts.filter(alert => alert.status === 'active').slice(0, 3);
            
            if (activeAlerts.length === 0) {
                container.innerHTML = `
                    <div class="text-center py-4">
                        <div class="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-2">
                            <svg class="w-6 h-6 text-green-600" fill="currentColor" viewBox="0 0 20 20">
                                <path fill-rule="evenodd" d="M2.166 4.999A11.954 11.954 0 0010 1.944 11.954 11.954 0 0017.834 5c.11.65.166 1.32.166 2.001 0 5.225-3.34 9.67-8 11.317C5.34 16.67 2 12.225 2 7c0-.682.057-1.35.166-2.001zm11.541 3.708a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clip-rule="evenodd"></path>
                            </svg>
                        </div>
                        <p class="text-sm text-gray-600">No active security alerts</p>
                    </div>
                `;
                return;
            }
            
            container.innerHTML = activeAlerts.map(alert => {
                const severityColors = {
                    high: 'red',
                    medium: 'yellow',
                    low: 'blue'
                };
                const color = severityColors[alert.severity];
                const timeAgo = Math.floor((Date.now() - alert.timestamp.getTime()) / 60000);
                
                return `
                    <div class="p-3 bg-${color}-50 rounded-lg border border-${color}-200">
                        <div class="flex items-start space-x-3">
                            <div class="w-6 h-6 bg-${color}-500 rounded-full flex items-center justify-center flex-shrink-0 mt-0.5">
                                <svg class="w-3 h-3 text-white" fill="currentColor" viewBox="0 0 20 20">
                                    ${getSecurityIcon(alert.type)}
                                </svg>
                            </div>
                            <div class="flex-1">
                                <p class="text-sm font-medium text-${color}-800">${alert.message}</p>
                                <p class="text-xs text-${color}-600 mt-1">${alert.device} • ${timeAgo}m ago</p>
                                <button onclick="resolveAlert(${alert.id})" class="text-xs text-${color}-700 font-medium mt-1 hover:underline">
                                    Resolve
                                </button>
                            </div>
                        </div>
                    </div>
                `;
            }).join('');
        }

        // Function to resolve security alert
        function resolveAlert(alertId) {
            const alert = securityAlerts.find(a => a.id === alertId);
            if (alert) {
                alert.status = 'resolved';
                renderSecurityAlerts();
            }
        }

        // IP Management Functions
        function blockIP(ipId) {
            const ip = ipConnections.find(i => i.id === ipId);
            if (ip) {
                ip.blocked = true;
                ip.status = 'blocked';
                renderIPConnections();
                updateIPStats();
                alert(`IP ${ip.ip} has been blocked successfully!`);
            }
        }

        function unblockIP(ipId) {
            const ip = ipConnections.find(i => i.id === ipId);
            if (ip) {
                ip.blocked = false;
                ip.status = ip.suspicious ? 'suspicious' : 'trusted';
                renderIPConnections();
                updateIPStats();
                alert(`IP ${ip.ip} has been unblocked.`);
            }
        }

        function trustIP(ipId) {
            const ip = ipConnections.find(i => i.id === ipId);
            if (ip && !ip.blocked) {
                ip.status = 'trusted';
                ip.suspicious = false;
                ip.riskLevel = 'low';
                renderIPConnections();
                updateIPStats();
                alert(`IP ${ip.ip} has been added to trusted list.`);
            }
        }

        function blockSuspiciousIPs() {
            let blockedCount = 0;
            ipConnections.forEach(ip => {
                if (ip.suspicious && !ip.blocked) {
                    ip.blocked = true;
                    ip.status = 'blocked';
                    blockedCount++;
                }
            });
            renderIPConnections();
            updateIPStats();
            alert(`${blockedCount} suspicious IPs have been blocked automatically.`);
        }

        function enableAutoBlock() {
            alert('Auto-block enabled! IPs with more than 100 connections or high risk levels will be automatically blocked.');
            ipConnections.forEach(ip => {
                if ((ip.connections > 100 || ip.riskLevel === 'critical') && !ip.blocked) {
                    ip.blocked = true;
                    ip.status = 'blocked';
                }
            });
            renderIPConnections();
            updateIPStats();
        }

        function whitelistTrusted() {
            let whitelistedCount = 0;
            ipConnections.forEach(ip => {
                if (ip.status === 'trusted' && ip.suspicious) {
                    ip.suspicious = false;
                    ip.riskLevel = 'low';
                    whitelistedCount++;
                }
            });
            renderIPConnections();
            updateIPStats();
            alert(`${whitelistedCount} IPs have been whitelisted.`);
        }

        // Function to render IP connections table
        function renderIPConnections() {
            const container = document.getElementById('ipConnectionsTable');
            const filter = document.getElementById('ipFilter').value;
            const search = document.getElementById('ipSearch').value.toLowerCase();
            
            let filteredIPs = ipConnections.filter(ip => {
                const matchesFilter = filter === 'all' || 
                    (filter === 'suspicious' && ip.suspicious) ||
                    (filter === 'blocked' && ip.blocked) ||
                    (filter === 'trusted' && ip.status === 'trusted');
                
                const matchesSearch = search === '' || 
                    ip.ip.toLowerCase().includes(search) ||
                    ip.location.toLowerCase().includes(search);
                
                return matchesFilter && matchesSearch;
            });

            container.innerHTML = filteredIPs.length ? filteredIPs.map(ip => {
                const statusColors = {
                    trusted: 'green',
                    suspicious: 'yellow',
                    blocked: 'red'
                };
                const color = statusColors[ip.status];
                const timeAgo = Math.floor((Date.now() - ip.lastActivity.getTime()) / 60000);
                
                return `
                    <tr class="border-b border-gray-200 hover:bg-gray-50">
                        <td class="p-3">
                            <div class="font-medium text-gray-900">${ip.ip}</div>
                            <div class="text-xs text-gray-500">${timeAgo}m ago</div>
                        </td>
                        <td class="p-3">
                            <div class="text-sm text-gray-900">${ip.location}</div>
                            <div class="text-xs text-gray-500">Risk: ${ip.riskLevel}</div>
                        </td>
                        <td class="p-3">
                            <div class="text-sm font-medium text-gray-900">${ip.connections}</div>
                            <div class="text-xs text-gray-500">connections</div>
                        </td>
                        <td class="p-3">
                            <div class="text-sm font-medium text-gray-900">${ip.dataTransfer}</div>
                            <div class="text-xs text-gray-500">transferred</div>
                        </td>
                        <td class="p-3">
                            <span class="inline-flex items-center px-2 py-1 rounded-full text-xs font-medium bg-${color}-100 text-${color}-800">
                                ${ip.status.charAt(0).toUpperCase() + ip.status.slice(1)}
                            </span>
                        </td>
                        <td class="p-3">
                            <div class="flex space-x-1">
                                ${!ip.blocked ? `
                                    <button onclick="blockIP(${ip.id})" class="text-xs px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors">
                                        Block
                                    </button>
                                ` : `
                                    <button onclick="unblockIP(${ip.id})" class="text-xs px-2 py-1 bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors">
                                        Unblock
                                    </button>
                                `}
                                ${!ip.blocked && ip.status !== 'trusted' ? `
                                    <button onclick="trustIP(${ip.id})" class="text-xs px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 transition-colors">
                                        Trust
                                    </button>
                                ` : ''}
                            </div>
                        </td>
                    </tr>
                `;
            }).join('') : `
                <tr>
                    <td colspan="6" class="text-center py-4 text-sm text-gray-600">No IP connections detected</td>
                </tr>
            `;
        }

        // Function to update IP statistics
        function updateIPStats() {
            const totalConnections = ipConnections.reduce((sum, ip) => sum + ip.connections, 0);
            const blockedCount = ipConnections.filter(ip => ip.blocked).length;
            const suspiciousCount = ipConnections.filter(ip => ip.suspicious && !ip.blocked).length;
            const ddosAttempts = ipConnections.filter(ip => ip.connections > 150).length;
            
            document.getElementById('totalConnections').textContent = totalConnections || 0;
            document.getElementById('blockedIps').textContent = blockedCount || 0;
            document.getElementById('suspiciousIps').textContent = suspiciousCount || 0;
            document.getElementById('ddosAttempts').textContent = ddosAttempts || 0;
            
            // Update threat level
            const threatLevelElement = document.getElementById('threatLevel');
            if (ddosAttempts > 2 || suspiciousCount > 5) {
                threatLevelElement.textContent = 'HIGH';
                threatLevelElement.className = 'text-sm font-medium text-red-800';
            } else if (ddosAttempts > 0 || suspiciousCount > 2) {
                threatLevelElement.textContent = 'MODERATE';
                threatLevelElement.className = 'text-sm font-medium text-yellow-800';
            } else {
                threatLevelElement.textContent = 'LOW';
                threatLevelElement.className = 'text-sm font-medium text-green-800';
            }
        }

        // Function to show DDoS protection modal
        function showDDoSProtectionModal() {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">DDoS Protection Settings</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 class="font-medium text-red-800 mb-2">Connection Rate Limiting</h4>
                            <p class="text-sm text-red-600 mb-3">Block IPs with excessive connection attempts</p>
                            <div class="flex items-center space-x-4">
                                <label class="text-sm text-red-700">Max connections per IP:</label>
                                <input type="number" value="100" class="border rounded px-2 py-1 w-20 text-sm">
                                <button onclick="alert('Rate limiting updated successfully')" class="px-3 py-1 bg-red-600 text-white rounded text-sm">Apply</button>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 class="font-medium text-yellow-800 mb-2">Geographic Blocking</h4>
                            <p class="text-sm text-yellow-600 mb-3">Block connections from specific countries</p>
                            <div class="flex items-center space-x-2">
                                <input type="text" placeholder="Enter country codes (e.g., CN, RU)" class="border rounded px-2 py-1 flex-1 text-sm">
                                <button onclick="alert('Geographic blocking rules updated')" class="px-3 py-1 bg-yellow-600 text-white rounded text-sm">Block Countries</button>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 class="font-medium text-blue-800 mb-2">Traffic Analysis</h4>
                            <p class="text-sm text-blue-600 mb-3">Advanced pattern detection and mitigation</p>
                            <div class="space-y-2">
                                <label class="flex items-center space-x-2">
                                    <input type="checkbox" checked class="rounded">
                                    <span class="text-sm text-blue-700">Enable behavioral analysis</span>
                                </label>
                                <label class="flex items-center space-x-2">
                                    <input type="checkbox" checked class="rounded">
                                    <span class="text-sm text-blue-700">Auto-block suspicious patterns</span>
                                </label>
                                <label class="flex items-center space-x-2">
                                    <input type="checkbox" class="rounded">
                                    <span class="text-sm text-blue-700">Challenge-response for suspicious IPs</span>
                                </label>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 class="font-medium text-green-800 mb-2">Whitelist Management</h4>
                            <p class="text-sm text-green-600 mb-3">Trusted IPs that bypass all restrictions</p>
                            <div class="flex items-center space-x-2">
                                <input type="text" placeholder="Enter IP address to whitelist" class="border rounded px-2 py-1 flex-1 text-sm">
                                <button onclick="alert('IP added to whitelist')" class="px-3 py-1 bg-green-600 text-white rounded text-sm">Add to Whitelist</button>
                            </div>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Update metrics (minimal, as most updates are in fetch functions)
        function updateMetrics() {
            fetchNetworkDevices();
            fetchIPConnections();
            fetchSecurityAlerts();
        }

        // Modal functions
        function showDeviceManagementModal() {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-96 overflow-y-auto">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">All Connected Devices</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="space-y-3">
                        ${deviceData.length ? deviceData.map(device => `
                            <div class="p-4 border rounded-lg ${device.status === 'paused' ? 'border-red-200 bg-red-50' : 'border-gray-200'}">
                                <div class="flex items-center justify-between">
                                    <div class="flex items-center space-x-4">
                                        <div class="w-10 h-10 bg-${device.status === 'active' ? device.color : 'red'}-100 rounded-lg flex items-center justify-center">
                                            <svg class="w-5 h-5 text-${device.status === 'active' ? device.color : 'red'}-600" fill="currentColor" viewBox="0 0 20 20">
                                                ${getDeviceIcon(device.type)}
                                            </svg>
                                        </div>
                                        <div>
                                            <p class="font-medium text-gray-900">${device.name}</p>
                                            <p class="text-sm text-gray-500">IP: ${device.ip} • MAC: ${device.mac}</p>
                                            <p class="text-sm text-gray-500">Category: ${device.category} • Activity: ${device.activity}</p>
                                        </div>
                                    </div>
                                    <div class="text-right">
                                        <p class="font-semibold text-gray-900">${device.bandwidth} Mbps</p>
                                        <p class="text-sm text-gray-500">Limit: ${device.bandwidthLimit} Mbps</p>
                                        <div class="flex space-x-2 mt-2">
                                            <button onclick="toggleDeviceStatus(${device.id}); this.closest('.fixed').remove(); showDeviceManagementModal();" class="text-xs px-3 py-1 rounded ${device.status === 'active' ? 'bg-red-100 text-red-700' : 'bg-green-100 text-green-700'}">
                                                ${device.status === 'active' ? 'Pause' : 'Resume'}
                                            </button>
                                            <button onclick="setBandwidthLimit(${device.id}, prompt('Set bandwidth limit (Mbps):', ${device.bandwidthLimit})); this.closest('.fixed').remove(); showDeviceManagementModal();" class="text-xs px-3 py-1 rounded bg-blue-100 text-blue-700">
                                                Set Limit
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        `).join('') : `
                            <div class="text-center py-4">
                                <p class="text-sm text-gray-600">No devices detected</p>
                            </div>
                        `}
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        function showSecurityToolsModal() {
            const modal = document.createElement('div');
            modal.className = 'fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50';
            modal.innerHTML = `
                <div class="bg-white rounded-xl p-6 max-w-2xl w-full mx-4">
                    <div class="flex items-center justify-between mb-4">
                        <h3 class="text-lg font-semibold text-gray-900">Security Tools & Configuration</h3>
                        <button onclick="this.closest('.fixed').remove()" class="text-gray-400 hover:text-gray-600">
                            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                            </svg>
                        </button>
                    </div>
                    <div class="space-y-4">
                        <div class="p-4 bg-red-50 border border-red-200 rounded-lg">
                            <h4 class="font-medium text-red-800 mb-2">Intrusion Detection System</h4>
                            <p class="text-sm text-red-600 mb-3">Monitor and block suspicious network activity</p>
                            <div class="flex space-x-2">
                                <button onclick="alert('IDS sensitivity increased to High')" class="px-3 py-1 bg-red-600 text-white rounded text-sm">Enable High Sensitivity</button>
                                <button onclick="alert('Blocked IP list updated')" class="px-3 py-1 bg-red-100 text-red-700 rounded text-sm">View Blocked IPs</button>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                            <h4 class="font-medium text-blue-800 mb-2">VPN Configuration</h4>
                            <p class="text-sm text-blue-600 mb-3">Secure remote connections and improve privacy</p>
                            <div class="flex space-x-2">
                                <button onclick="alert('VPN server configured successfully')" class="px-3 py-1 bg-blue-600 text-white rounded text-sm">Setup VPN Server</button>
                                <button onclick="alert('VPN client profiles generated')" class="px-3 py-1 bg-blue-100 text-blue-700 rounded text-sm">Generate Client Profiles</button>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-green-50 border border-green-200 rounded-lg">
                            <h4 class="font-medium text-green-800 mb-2">Firewall Rules</h4>
                            <p class="text-sm text-green-600 mb-3">Configure network access and port blocking</p>
                            <div class="flex space-x-2">
                                <button onclick="alert('Firewall rules updated successfully')" class="px-3 py-1 bg-green-600 text-white rounded text-sm">Update Rules</button>
                                <button onclick="alert('Port scan protection enabled')" class="px-3 py-1 bg-green-100 text-green-700 rounded text-sm">Enable Port Protection</button>
                            </div>
                        </div>
                        
                        <div class="p-4 bg-yellow-50 border border-yellow-200 rounded-lg">
                            <h4 class="font-medium text-yellow-800 mb-2">Security Recommendations</h4>
                            <ul class="text-sm text-yellow-700 space-y-1">
                                <li>• Enable WPA3 encryption on all access points</li>
                                <li>• Update router firmware to latest version</li>
                                <li>• Configure guest network isolation</li>
                                <li>• Enable automatic security updates</li>
                            </ul>
                            <button onclick="alert('Security recommendations applied')" class="mt-2 px-3 py-1 bg-yellow-600 text-white rounded text-sm">Apply All Recommendations</button>
                        </div>
                    </div>
                </div>
            `;
            document.body.appendChild(modal);
        }

        // Initialize displays
        addIPCard();
        updateNetworkInfo();
        fetchNetworkDevices();
        fetchIPConnections();
        fetchSecurityAlerts();

        // Update every 10 seconds
        setInterval(() => {
            updateNetworkInfo();
            updateMetrics();
        }, 10000);

        // Listen for network changes
        if ('connection' in navigator) {
            const connection = navigator.connection || navigator.mozConnection || navigator.webkitConnection;
            connection.addEventListener('change', updateNetworkInfo);
        }

        // Add click handlers for buttons
        document.getElementById('manageDevicesBtn').addEventListener('click', showDeviceManagementModal);
        document.getElementById('securityToolsBtn').addEventListener('click', showSecurityToolsModal);
        document.getElementById('refreshIpsBtn').addEventListener('click', function() {
            fetchIPConnections();
            this.textContent = 'Refreshed ✓';
            setTimeout(() => {
                this.textContent = 'Refresh IPs';
            }, 2000);
        });
        document.getElementById('ddosProtectionBtn').addEventListener('click', showDDoSProtectionModal);
        document.getElementById('ipFilter').addEventListener('change', renderIPConnections);
        document.getElementById('ipSearch').addEventListener('input', renderIPConnections);
        
        document.querySelectorAll('button').forEach(button => {
            button.addEventListener('click', function() {
                if (this.textContent.includes('Apply Now')) {
                    this.textContent = 'Applied ✓';
                    this.classList.add('opacity-50');
                    this.disabled = true;
                } else if (this.textContent.includes('Schedule Update')) {
                    this.textContent = 'Scheduled ✓';
                    this.classList.add('opacity-50');
                    this.disabled = true;
                } else if (this.textContent.includes('View Details')) {
                    alert('Bandwidth Details:\n\nNo detailed breakdown available without network API.\n\nRecommendation: Integrate with a network management API for detailed device data.');
                }
            });
        });