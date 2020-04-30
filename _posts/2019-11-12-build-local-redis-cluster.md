---
layout: post
cover: './../assets/img/system-integration.jpg'
navigation: True
title: 在 mac 上搭建本地 redis cluster 
date: 2019-11-12 22:13:21
tags: redis middle-ware
subclass: 'post tag-fiction'
logo: './../assets/images/ghost.png'
author: kidlovec
categories: kidlovec
---



>Mac 搭建 redis cluster


``` bash
cd ~
mkdir redis-cluster
cd redis-cluster
for ((i=1; i<=6;i++)); do mkdir $(expr 9000 + $i); done
# 将本地 brew 安装好的 redis 配置拷贝过来
cp /usr/local/etc/redis.conf 9001/redis.conf
```

修改 redis 配置

``` bash
# 端口号，每个目录都不同
port 9001
# 开启集群模式
cluster-enabled yes
#节点超时实际，单位毫秒
cluster-node-timeout 5000
#集群内部配置文件(默认为 nodes.conf)
cluster-config-file nodes-9001.conf
# 启动 AOF
appendonly yes
# append 文件名
appendfilename "appendonly-9001.aof"
# dir /usr/local/var/db/redis/ 
# 注意: 这里 {cluster-path} 换成本地集群文件的位置 比如 /Users/your-name/redis-cluster/9001
dir {cluster-path}/9001/
```

依次修改 其他文件夹
比如 9002 文件夹

``` bash
cp 9001/redis.conf 9002/redis.conf && sed -i "s/9001/9002/g" 9002/redis.conf
```			

或者用批量命令

``` bash
# 复制文件
for PORT in {9002..9006}; do cp 9001/redis.conf $PORT/redis.conf && ;  done
# 修改文件
for PORT in {9002..9006}; do sed -i '' "s/9001/$PORT/g" "$PORT/redis.conf" ;  done
```

查看一下改动

``` bash
for PORT in {9002..9006}; do grep -w $PORT $PORT/redis.conf -n ; done
92:port 9002
264:dir Users/kidlovec/redis-cluster/9002
677:appendfilename "appendonly-9002.aof"
823:cluster-config-file nodes-9002.conf
92:port 9003
264:dir Users/kidlovec/redis-cluster/9003
677:appendfilename "appendonly-9003.aof"
823:cluster-config-file nodes-9003.conf
92:port 9004
264:dir Users/kidlovec/redis-cluster/9004
677:appendfilename "appendonly-9004.aof"
823:cluster-config-file nodes-9004.conf
92:port 9005
264:dir Users/kidlovec/redis-cluster/9005
677:appendfilename "appendonly-9005.aof"
823:cluster-config-file nodes-9005.conf
92:port 9006
264:dir Users/kidlovec/redis-cluster/9006
677:appendfilename "appendonly-9006.aof"
823:cluster-config-file nodes-9006.conf
```

改完了, 这时候文件树是这样的

```

➜ tree -L 2
.
├── 9001
│   └── redis.conf
├── 9002
│   └── redis.conf
├── 9003
│   └── redis.conf
├── 9004
│   └── redis.conf
├── 9005
│   └── redis.conf
└── 9006
    └── redis.conf

```

写一个 集群管理简易脚本 

``` bash
vi cluster.sh
```

``` bash
#!/bin/bash 

REDIS_HOME=~/redis-cluster
APP_NAME=redis
WAIT_TIME=2
echo "REDIS_HOME:"${REDIS_HOME}

start() {
	for PORT in {9001..9006}
	do
	    REDIS_ID=$(ps -ef | grep ${APP_NAME} |grep ${PORT}| grep -v 'grep' | head -1 | awk '{print $2}')
	    
	    if [ -z "$REDIS_ID" ]; then
	       
	        echo ""
	        echo "[${APP_NAME}-$PORT] starting ..."
	        echo ""
	        cd $REDIS_HOME/$PORT
	        redis-server redis.conf & >/dev/null 2>&1
	        sleep ${WAIT_TIME}
	    else
	    echo "[${APP_NAME}] has been started! "
	    fi   
	done
}

stop() {
	for PORT in {9001..9006}
	do
	    REDIS_ID=$(ps -ef | grep ${APP_NAME} |grep ${PORT}| grep -v 'grep' | head -1 | awk '{print $2}')
	    if [ -z "$REDIS_ID" ]; then
	           
	        echo "[${APP_NAME}-$PORT] has been stopped!"
	    else
	        echo ""
	        echo "[${APP_NAME}-$PORT] is stoping ..."
	        echo ""
	        kill -15 $REDIS_ID
	        sleep ${WAIT_TIME}
	    fi   
	done
}

status() {
	
	for PORT in {9001..9006}
	do
	    REDIS_ID=$(ps -ef | grep ${APP_NAME} |grep ${PORT}| grep -v 'grep' | head -1 | awk '{print $2}')
	    if [ -z "$REDIS_ID" ]; then
	        echo "[${APP_NAME}-$PORT] has been stop !"
	    else
	        echo "[${APP_NAME}-$PORT] is running !"
	    fi
	done
}

case "$1" in
start)
echo "starting redis cluster"
start
;;
stop)
echo "stopping redis cluster servers "
stop
;;
status)
status
;;
restart)
echo "restart redis cluster"
$0 stop
sleep 2
$0 start
;;
*)
printf 'Usage: %s {start|stop|status|restart}\n' "$prog"
exit 1
;;
esac
```
### 启动集群

```
./cluster.sh start
```

这时候文件树是这样的

``` bash
➜ tree -L 2
.
├── 9001
│   ├── 9001.log
│   ├── appendonly-9001.aof
│   ├── nodes-9001.conf
│   └── redis.conf
├── 9002
│   ├── 9002.log
│   ├── appendonly-9002.aof
│   ├── nodes-9002.conf
│   └── redis.conf
├── 9003
│   ├── 9003.log
│   ├── appendonly-9003.aof
│   ├── nodes-9003.conf
│   └── redis.conf
├── 9004
│   ├── 9004.log
│   ├── appendonly-9004.aof
│   ├── nodes-9004.conf
│   └── redis.conf
├── 9005
│   ├── 9005.log
│   ├── appendonly-9005.aof
│   ├── nodes-9005.conf
│   └── redis.conf
├── 9006
│   ├── 9006.log
│   ├── appendonly-9006.aof
│   ├── nodes-9006.conf
│   └── redis.conf
└── create-cluster.sh

6 directories, 25 files

```


## 设置 集群


Redis 5 的 集群管理由原来的 ruby 脚本，都换成 C 中了，可以直接使用 `redis-cli` 更加便捷

具体可以查看 `cluster` 支持的命令

```bash
redis-cli --cluster help
```

现在 我们创建集群

以下命令可以自动为我们设置 三主三从的集群
9001 <-- 9004
9002 <-- 9005
9003 <-- 9006

```bash

redis-cli --cluster create 127.0.0.1:9001 127.0.0.1:9002 127.0.0.1:9003 127.0.0.1:9004 127.0.0.1:9005 127.0.0.1:9006 --cluster-replicas 1

>>> Performing hash slots allocation on 6 nodes...
Master[0] -> Slots 0 - 5460
Master[1] -> Slots 5461 - 10922
Master[2] -> Slots 10923 - 16383
Adding replica 127.0.0.1:9004 to 127.0.0.1:9001
Adding replica 127.0.0.1:9005 to 127.0.0.1:9002
Adding replica 127.0.0.1:9006 to 127.0.0.1:9003
>>> Trying to optimize slaves allocation for anti-affinity
[WARNING] Some slaves are in the same host as their master
M: 18a2f6036c486dc5df56edb096ac879590cc76b2 127.0.0.1:9001
   slots:[0-5460] (5461 slots) master
M: 4635943ae587ff32e0e3f28dc9b533231bab6af7 127.0.0.1:9002
   slots:[5461-10922] (5462 slots) master
M: bb9396c5c3c6a16a38be58810026395331515a34 127.0.0.1:9003
   slots:[10923-16383] (5461 slots) master
S: 935906dec5a496caa7bfefd8562582afef41c7f6 127.0.0.1:9004
   replicates 4635943ae587ff32e0e3f28dc9b533231bab6af7
S: 40356db1c9b7847b41099bb06da8e3e5022f679b 127.0.0.1:9005
   replicates bb9396c5c3c6a16a38be58810026395331515a34
S: add58f1bb36a5da23bfe5c8b8249836725ec27cb 127.0.0.1:9006
   replicates 18a2f6036c486dc5df56edb096ac879590cc76b2
Can I set the above configuration? (type 'yes' to accept): 27.0.0.1:9004
   replicates 4635943ae587ff32e0e3f28dc9b533231bab6af7
S: 40356db1c9b7847b41099bb06da8e3e5022f679b 127.0.0.1:9005
   replicates bb9396c5c3c6a16a38be58810026395331515a34
S: add58f1bb36a5da23bfe5c8b8249836725ec27cb 127.0.0.1:9006
   replicates 18a2f6036c486dc5df56edb096ac879590cc76b2
Can I set the above configuration? (type 'yes' to accept): 

```

同意

```bash
Can I set the above configuration? (type 'yes' to accept): yes
>>> Nodes configuration updated
>>> Assign a different config epoch to each node
>>> Sending CLUSTER MEET messages to join the cluster
Waiting for the cluster to join
.
>>> Performing Cluster Check (using node 127.0.0.1:9001)
M: 18a2f6036c486dc5df56edb096ac879590cc76b2 127.0.0.1:9001
   slots:[0-5460] (5461 slots) master
   1 additional replica(s)
M: 4635943ae587ff32e0e3f28dc9b533231bab6af7 127.0.0.1:9002
   slots:[5461-10922] (5462 slots) master
   1 additional replica(s)
S: add58f1bb36a5da23bfe5c8b8249836725ec27cb 127.0.0.1:9006
   slots: (0 slots) slave
   replicates bb9396c5c3c6a16a38be58810026395331515a34
M: bb9396c5c3c6a16a38be58810026395331515a34 127.0.0.1:9003
   slots:[10923-16383] (5461 slots) master
   1 additional replica(s)
S: 40356db1c9b7847b41099bb06da8e3e5022f679b 127.0.0.1:9005
   slots: (0 slots) slave
   replicates 4635943ae587ff32e0e3f28dc9b533231bab6af7
S: 935906dec5a496caa7bfefd8562582afef41c7f6 127.0.0.1:9004
   slots: (0 slots) slave
   replicates 18a2f6036c486dc5df56edb096ac879590cc76b2
[OK] All nodes agree about slots configuration.
>>> Check for open slots...
>>> Check slots coverage...
[OK] All 16384 slots covered.
```

这样集群就创建成功了，进入集群查看

```  bash
➜ redis-cli -p 9001 cluster nodes
4635943ae587ff32e0e3f28dc9b533231bab6af7 127.0.0.1:9002@19002 master - 0 1588066642132 2 connected 5461-10922
add58f1bb36a5da23bfe5c8b8249836725ec27cb 127.0.0.1:9006@19006 slave bb9396c5c3c6a16a38be58810026395331515a34 0 1588066642334 6 connected
18a2f6036c486dc5df56edb096ac879590cc76b2 127.0.0.1:9001@19001 myself,master - 0 1588066642000 1 connected 0-5460
bb9396c5c3c6a16a38be58810026395331515a34 127.0.0.1:9003@19003 master - 0 1588066642000 3 connected 10923-16383
40356db1c9b7847b41099bb06da8e3e5022f679b 127.0.0.1:9005@19005 slave 4635943ae587ff32e0e3f28dc9b533231bab6af7 0 1588066642334 5 connected
935906dec5a496caa7bfefd8562582afef41c7f6 127.0.0.1:9004@19004 slave 18a2f6036c486dc5df56edb096ac879590cc76b2 0 1588066642132 4 connected

```