# magnetai-worker

## Prerequisites

### Prometheus

1. Configure your prometheus config file in prometheus.yml.
1. Start up prometheus by running following commands:
```
cd docker
sudo docker-compose -f docker-compose.yml up -d
```

### Nvidia tools

Make sure **nvidia-smi** can be reached.
