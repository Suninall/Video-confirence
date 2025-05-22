import { useState, useRef, useEffect} from "react";
import io from "socket.io-client";
const Body = ({id}) => {
    const [expanded, setExpanded] = useState(false);
    const [inCall, setInCall] = useState(false);//состояние звонка
    const localVideoRef = useRef(null);
    const remoteVideoRef = useRef(null);
    const peerConnection = useRef(null);
    const socketRef = useRef(null);

    const toggleScreenSize = () => {
      setExpanded(!expanded);
    };

  //запуск вебРТС 
  useEffect(() => {
    socketRef.current = io("http://localhost:5173");

    //создаю новое соединение между клиентами
    peerConnection.current = createPeerConnection();

    //доступ к камере и микрофону 
    navigator.mediaDevices.getUserMedia({ video: true, audio: true })
      .then((stream) => {
        localVideoRef.current.srcObject = stream;
        stream.getTracks().forEach((track) => {
          peerConnection.current.addTrack(track, stream);//добаляет все камеры 
        });
      });

    //когда приходит новый пользователь 
    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };

    //сигнал приглашения в видео звонок
    socketRef.current.on("offer", async (offer) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(offer));
      const answer = await peerConnection.current.createAnswer();
      await peerConnection.current.setLocalDescription(answer);
      socketRef.current.emit("answer", answer);//ответ
    });

    //описание ответа 
    socketRef.current.on("answer", async (answer) => {
      await peerConnection.current.setRemoteDescription(new RTCSessionDescription(answer));
    });

    //добавление человека
    socketRef.current.on("ice-candidate", async (candidate) => {
      try {
        await peerConnection.current.addIceCandidate(new RTCIceCandidate(candidate));
      } catch (e) {
        console.error("Ошибка добавления кандидата", e);
      }
    });

    
    return () => {
      socketRef.current.disconnect();
    };
  }, []);

  const createPeerConnection = () => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
    });
  
    pc.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", event.candidate);
      }
    };
  
    pc.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  
    return pc;
  };

  const setupPeerConnectionHandlers = () => {
    peerConnection.current.onicecandidate = (event) => {
      if (event.candidate) {
        socketRef.current.emit("ice-candidate", event.candidate);
      }
    };
  
    peerConnection.current.ontrack = (event) => {
      remoteVideoRef.current.srcObject = event.streams[0];
    };
  };
  
  const startCall = async () => {
    //добавляем камеру 
    const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
    localVideoRef.current.srcObject = stream;
    stream.getTracks().forEach((track) => {
      peerConnection.current.addTrack(track, stream);
    });
  
    const offer = await peerConnection.current.createOffer();
    await peerConnection.current.setLocalDescription(offer);
    socketRef.current.emit("offer", offer);
    setInCall(true);
  };

  const endCall = () => {
    // Отключаем локальные треки
    if (localVideoRef.current?.srcObject) {
      localVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      localVideoRef.current.srcObject = null;
    }
  
    // Отключаем удалённые треки
    if (remoteVideoRef.current?.srcObject) {
      remoteVideoRef.current.srcObject.getTracks().forEach(track => track.stop());
      remoteVideoRef.current.srcObject = null;
    }
  
    // Закрываем соединение, но не обнуляем ссылку
    if (peerConnection.current) {
      peerConnection.current.getSenders().forEach(sender => peerConnection.current.removeTrack(sender));
      peerConnection.current.close();
      peerConnection.current = new RTCPeerConnection({
        iceServers: [{ urls: "stun:stun.l.google.com:19302" }],
      });
      setupPeerConnectionHandlers();
    }
  
    setInCall(false);
  };

    return(
      <main className="main-container">
        <div className="page-container">
            <h1 className="visually-hidden" >Page</h1>
            <h1 className="title">РОБОТ: {id}</h1>
            <div className={`border-screen ${expanded ? 'expanded-border' : ''}`}>
              <div className={`camera-screen ${expanded ? 'expanded' : ''}`}>
                <video className={`video-block ${expanded ? 'expanded' : ''}`} ref={localVideoRef} autoPlay muted playsInline></video>
                {/* <video className="video-block" ref={remoteVideoRef} autoPlay playsInline></video> */}
              </div>
              <div className=" button-container">
                <button className="extension-button" onClick={toggleScreenSize}>
                  {expanded ? 'УМЕНЬШИТЬ' : 'УВЕЛИЧИТЬ'}
                  <img className="button-img" alt="extension-button" src="../markup/img/button.png" width={12} height={12}/> 
                </button>
                <button className="extension-button" onClick={inCall ? endCall : startCall}>
                  {inCall ? 'ЗАВЕРШИТЬ' : 'ЗВОНОК'}
                </button>
              </div>
            </div>
            <section className="controller">
              <button className="controller-button button">
                <img alt="arrow" className="arrow arrow-forward" src="../markup/img/arrow.svg" />
              </button>

              <div className="controller-row">
                <button className="controller-button button">
                  <img alt="arrow" className="arrow arrow-left" src="../markup/img/arrow.svg" />
                </button>
                <button className="controller-button button">
                  <img alt="arrow" className="arrow arrow-right" src="../markup/img/arrow.svg" />
                </button>
              </div>

              <button className="controller-button button">
                <img alt="arrow" className="arrow arrow-back" src="../markup/img/arrow.svg" />
              </button>
           </section>
          </div>
      </main>
    );
}

export default Body;