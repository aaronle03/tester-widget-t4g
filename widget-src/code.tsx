const { widget } = figma
const { AutoLayout, Frame, Span, Text, Ellipse, useSyncedMap, useSyncedState, useEffect, waitForTask, useWidgetId, usePropertyMenu } = widget

const FOURTY_FIVE_MINUTES = 45 * 60 * 1000;
const TWENTY_FIVE_MINUTES = 25 * 60 * 1000;
const TEN_MINUTES = 10 * 60 * 1000;
const FIVE_MINUTES = 5 * 60 * 1000;

const STARTING_ANGLE = 1.5*Math.PI
const BASE_ARC_DATA = {
  startingAngle: -0.5 * Math.PI,
  endingAngle: 2 * Math.PI,
  innerRadius: 0.95
}

function PomodoroTimer() {
  const widgetId = useWidgetId()

  const [timerMenuValue, setTimerMenuValue] = useSyncedState('timerMenuValue', '25')
  const [timerValue, setTimerValue] = useSyncedState('timerValue', TWENTY_FIVE_MINUTES)
  const [isRunning, setIsRunning] = useSyncedState('isRunning', false);
  const [timeRemaining, setTimeRemaining] = useSyncedState('timeRemaining',timerValue)
  const [arcData, setArcData] = useSyncedState('arcData', BASE_ARC_DATA)

  let timeout: number;
  
  useEffect(() => {
     if (!isRunning) return;

      waitForTask(new Promise(resolve => {
        timeout = setTimeout(() => {
          if (!isRunning) {
            return resolve(null)
          }
          const updatedTime = timeRemaining - 500

          const endAngle = 2*Math.PI*(updatedTime/ timerValue ) - 0.5*Math.PI

          setArcData({
            startingAngle: -0.5*Math.PI,
            endingAngle: endAngle,
            innerRadius: 0.95
          })

          if (updatedTime % 500 === 0) {
            setTimeRemaining(updatedTime)
            updateNodeName()
          }

          if (updatedTime <= 0) {
            completeTimer()
            return
          }

          resolve(null)
        }, 500)
      }))

    return () => clearInterval(timeout)
  });

  const completeTimer = () => {
    setIsRunning(false);
    scrollToWidget()
    const widgetNode = figma.getNodeById(widgetId)
    if (widgetNode) {
      widgetNode.name = `Pomodoro Timer - Finished`
    }
  }

  const resetTimer = (delay = 500, updatedTimeRemaining = 0) => {
    setIsRunning(false)
    waitForTask(new Promise(resolve => {
      setTimeout(() => {
        setTimeRemaining(updatedTimeRemaining || timerValue)
        setArcData(BASE_ARC_DATA)
        clearTimeout(timeout)
        const widgetNode = figma.getNodeById(widgetId)
        if (widgetNode) {
          widgetNode.name = "Pomodoro Timer"
        }
        resolve(null)
      }, delay)
    })); 
  }

  const startTimer = () => {
    if (isRunning) return
    if (timeRemaining <= 0) resetTimer(0)
    setIsRunning(true);    
  }
  const pauseTimer = () => {
    if (isRunning) setIsRunning(false);
  }
  const format = (num: number) => {
    return num < 10 ? "0" + num : num.toString().slice(0,2);
  };

  const formattedTimeRemaining = `${format(Math.floor(timeRemaining/ (60 *1000) % 60))}:${format(Math.floor(timeRemaining/1000) % 60)}`

  const updateNodeName = () => {
    const widgetNode = figma.getNodeById(widgetId)
    if (widgetNode) {
      widgetNode.name = `Pomodoro Timer ${formattedTimeRemaining}`
    }
  }
  const scrollToWidget = () => {
    const widgetNode = figma.getNodeById(widgetId)
    if (widgetNode) figma.viewport.scrollAndZoomIntoView([widgetNode]);
  }

  usePropertyMenu(
    [
      {
        itemType: 'dropdown',
        tooltip: 'Timer',
        propertyName: 'timer',
        selectedOption: timerMenuValue,
        options: [{ option: '45', label: '45 minutes'}, { option: '25', label: '25 minutes' }, { option: '10', label: '10 minutes' }, { option: '5', label: '5 minutes' }],
      },
    ],
    (e) => {
      if (e.propertyName === 'timer') {
        const updatedNumMinutes = e.propertyValue as string
        let updatedNumMs: number;

        if (updatedNumMinutes === '45') {
          updatedNumMs = FOURTY_FIVE_MINUTES;
        } else if (updatedNumMinutes === '25') {
          updatedNumMs = TWENTY_FIVE_MINUTES;
        } else if (updatedNumMinutes === '10') {
          updatedNumMs = TEN_MINUTES;
        } else {
          updatedNumMs = FIVE_MINUTES;
        }


        let timeout = 0
        if (isRunning) {
          pauseTimer()
          timeout= 500
        }
        waitForTask(new Promise(resolve => {
          setTimeout(() => {
            setTimerMenuValue(updatedNumMinutes)
            setTimerValue(updatedNumMs)
            resetTimer(100, updatedNumMs)
            resolve(null)
          }, timeout)
        }));

      }
    },
  )


  return (    
    <AutoLayout
      verticalAlignItems="center"
      horizontalAlignItems="center"
      direction="vertical"
      padding={{ left: 16, right: 16, top: 16, bottom: 16 }}
      fill="#1E1E1E"
      cornerRadius={8}
      spacing={12}
      strokeWidth={3}
      width={150}
      stroke={{
        type: 'solid',
        color: '#353535',
      }}
      effect={{
        type: 'drop-shadow',
        color: { r: 0, g: 0, b: 0, a: 0.2 },
        offset: { x: 0, y: 0 },
        blur: 2,
        spread: 2,
      }}
    >
      <Frame 
        width={100} 
        height={100} 
      >
        <Ellipse
          fill="#353535"
          arcData={{
            startingAngle: -0.5 * Math.PI,
            endingAngle: 2 * Math.PI,
            innerRadius: 0.95
          }}
        />
        <Ellipse
          fill="#FBA421"
          arcData={arcData}
        />
        <Text 
          width={55} 
          fill="#fff"
          fontSize={18}
          fontWeight="bold"
          y={39}
          x={25}
        > 
          {formattedTimeRemaining}
        </Text>
      </Frame>
      <AutoLayout
       verticalAlignItems="center"
       direction="horizontal"
       spacing={12}
      >
        <AutoLayout 
          onClick={() => isRunning ? pauseTimer() : startTimer()}
          padding={{ left: 4, right: 4, top: 2, bottom: 2 }}
          fill="#FBA421"
          cornerRadius={4}
          hoverStyle={{
            opacity: 0.8
          }}
          
        >
          <Text fontWeight="bold">{isRunning ? 'Pause' : 'Start'}</Text>
        </AutoLayout>
        <AutoLayout>
        <AutoLayout
            onClick={() => resetTimer()}
            cornerRadius={4}
            padding={{ left: 4, right: 4, top: 2, bottom: 2 }}
            strokeWidth={1}
            stroke="#fff"
            hoverStyle={{
              opacity: 0.8
            }}
          >
            <Text fill="#fff" fontWeight="bold">Reset</Text>
          </AutoLayout>
        </AutoLayout>
      </AutoLayout>     
    </AutoLayout>
  );
}

widget.register(PomodoroTimer)