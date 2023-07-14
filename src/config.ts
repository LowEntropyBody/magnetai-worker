export const GPU_INFO_CMD = `
#!/bin/bash
nvidia-smi &>/dev/null;
if [ $? -ne 0 ]; then
    echo "invoke command 'nvidia-smi' failed";
    exit 1;
fi;

gpu_type=$(nvidia-smi -L | head -n 1 | awk '{print $3,$4}')
mem_total=$(nvidia-smi -q -d PIDS,POWER,MEMORY | grep 'Total' | head -n 1 | awk -F: '{print $2}');
mem_total=$\{mem_total:1\}
mem_used=$(nvidia-smi -q -d PIDS,POWER,MEMORY | grep 'Used GPU Memory' | head -n 1 | awk -F: '{print $2}');
mem_used=$\{mem_used:1\}
power_limit=$(nvidia-smi -q -d PIDS,POWER,MEMORY | grep 'Power Limit' | head -n 1 | awk -F: '{print $2}');
power_limit=$\{power_limit:1\}
power_draw=$(nvidia-smi -q -d PIDS,POWER,MEMORY | grep 'Power Draw' | head -n 1 | awk -F: '{print $2}');
power_draw=$\{power_draw:1\}

echo '{"gpuType":"'$gpu_type'","memoryTotal":"'$mem_total'","memoryUsed":"'$mem_used'","powerLimit":"'$power_limit'","powerDraw":"'$power_draw'"}'
`
